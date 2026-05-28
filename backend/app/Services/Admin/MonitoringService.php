<?php

namespace App\Services\Admin;

use App\Models\ServerMonitoring;
use App\Models\StreamServer;
use App\Services\Flussonic\FlussonicApiService;
use Ramsey\Uuid\Uuid;
use Exception;

class MonitoringService
{
    private FlussonicApiService $flussonicApiService;

    public function __construct(FlussonicApiService $flussonicApiService)
    {
        $this->flussonicApiService = $flussonicApiService;
    }

    /**
     * Returns the latest snapshot for every active server.
     */
    public function getLatestPerServer(): array
    {
        $servers = StreamServer::whereNull('deleted_at')
            ->where('status', 'active')
            ->get(['id', 'uuid', 'server_name', 'server_host_ip', 'health_status']);

        $result = [];
        foreach ($servers as $server) {
            $latest = ServerMonitoring::where('server_id', $server->id)
                ->orderByDesc('recorded_at')
                ->first();

            $result[] = [
                'server_uuid'    => $server->uuid,
                'server_name'    => $server->server_name,
                'server_host_ip' => $server->server_host_ip,
                'health_status'  => $server->health_status,
                'latest'         => $latest,
            ];
        }

        return $result;
    }

    /**
     * Returns paginated metric history for a single server.
     */
    public function getHistory(string $serverUuid, int $limit = 24): array
    {
        $server = StreamServer::where('uuid', $serverUuid)->firstOrFail();

        return ServerMonitoring::where('server_id', $server->id)
            ->orderByDesc('recorded_at')
            ->limit(max(1, min($limit, 200)))
            ->get()
            ->toArray();
    }

    /**
     * Record a single metric snapshot for a server.
     */
    public function record(string $serverUuid, array $data): ServerMonitoring
    {
        $server = StreamServer::where('uuid', $serverUuid)
            ->whereNull('deleted_at')
            ->firstOrFail();

        $metric                 = new ServerMonitoring();
        $metric->uuid           = Uuid::uuid4()->toString();
        $metric->server_id      = $server->id;
        $metric->cpu_usage      = (float)($data['cpu_usage']      ?? 0);
        $metric->ram_usage      = (float)($data['ram_usage']      ?? 0);
        $metric->disk_usage     = (float)($data['disk_usage']     ?? 0);
        $metric->network_in     = (int)($data['network_in']       ?? 0);
        $metric->network_out    = (int)($data['network_out']      ?? 0);
        $metric->active_streams = (int)($data['active_streams']   ?? 0);
        $metric->active_viewers = (int)($data['active_viewers']   ?? 0);
        $metric->recorded_at    = $data['recorded_at'] ?? date('Y-m-d H:i:s');
        $metric->save();

        return $metric;
    }

    /**
     * Pull monitoring data from Flussonic API and record it for all active servers.
     * Returns a summary of what was recorded.
     */
    public function recordAllFromFlussonic(): array
    {
        $servers = StreamServer::whereNull('deleted_at')
            ->where('status', 'active')
            ->get();

        $results = ['total' => 0, 'recorded' => 0, 'failed' => 0, 'details' => []];

        foreach ($servers as $server) {
            $results['total']++;
            try {
                $raw = $this->flussonicApiService->request($server, 'monitoring');

                // Flussonic returns cpu/ram/disk as percentages or raw values — normalise defensively
                $cpuUsage  = (float)($raw['cpu_usage']  ?? $raw['cpu']  ?? 0);
                $ramUsage  = (float)($raw['ram_usage']  ?? $raw['ram']  ?? 0);
                $diskUsage = (float)($raw['disk_usage'] ?? $raw['disk'] ?? 0);

                // Network: may be bytes/s
                $netIn  = (int)($raw['network_in']  ?? $raw['net_in']  ?? 0);
                $netOut = (int)($raw['network_out'] ?? $raw['net_out'] ?? 0);

                $activeStreams  = (int)($raw['active_streams']  ?? $raw['streams_total']  ?? 0);
                $activeViewers = (int)($raw['active_viewers']  ?? $raw['clients_total']  ?? 0);

                $metric = $this->record($server->uuid, [
                    'cpu_usage'      => $cpuUsage,
                    'ram_usage'      => $ramUsage,
                    'disk_usage'     => $diskUsage,
                    'network_in'     => $netIn,
                    'network_out'    => $netOut,
                    'active_streams' => $activeStreams,
                    'active_viewers' => $activeViewers,
                ]);

                $results['recorded']++;
                $results['details'][] = ['server' => $server->server_name, 'status' => 'ok', 'metric_id' => $metric->uuid];
            } catch (Exception $e) {
                $results['failed']++;
                $results['details'][] = ['server' => $server->server_name, 'status' => 'error', 'error' => $e->getMessage()];
            }
        }

        return $results;
    }
}
