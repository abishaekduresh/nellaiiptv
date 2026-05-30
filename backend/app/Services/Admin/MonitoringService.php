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
     *
     * Strategy:
     *  1. GET /streams — always available; gives stream count, viewer count, network bitrate.
     *  2. GET /monitoring/system (or /monitoring, /cluster) — soft-fail; gives CPU/RAM/disk
     *     when the Flussonic plan/version exposes it. Zeros recorded if unavailable.
     *
     * A snapshot is always recorded as long as we can reach the server.
     * Only hard-fails on auth errors or complete unreachability.
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
                // ── Step 1: stream / viewer / bitrate from /streams ──────────────
                $activeStreams = 0;
                $activeViewers = 0;
                $netIn  = 0;
                $netOut = 0;
                $streamsError = null;

                try {
                    $streamsRaw  = $this->flussonicApiService->request($server, 'streams');

                    // Key can be 'streams', 'items', 'channels', 'data', or flat array
                    $streamsList = $streamsRaw['streams']  ??
                                   $streamsRaw['items']    ??
                                   $streamsRaw['channels'] ??
                                   $streamsRaw['data']     ?? [];
                    if (empty($streamsList) && isset($streamsRaw[0])) {
                        $streamsList = $streamsRaw;
                    }

                    foreach ($streamsList as $s) {
                        $activeStreams++;

                        // Flussonic v3 stats sub-object — confirmed field names from API response
                        $stats = is_array($s['stats'] ?? null) ? $s['stats'] : [];

                        // Active viewers: Flussonic v3 uses playback_opened_sessions
                        $activeViewers += (int)(
                            $stats['playback_opened_sessions'] ??  // v3 confirmed
                            $stats['clients']                  ??
                            $stats['viewers']                  ??
                            $s['clients']                      ??
                            $s['viewers']                      ??
                            $s['clients_count']                ?? 0
                        );

                        // Network: Flussonic v3 only exposes cumulative byte counters
                        // (inputs_bytes / playback_bytes), not real-time bitrate.
                        // Sum them across streams; the UI labels these as total transfer.
                        $netIn  += (int)($stats['inputs_bytes']   ?? 0);
                        $netOut += (int)($stats['playback_bytes'] ?? 0);
                    }
                } catch (Exception $e) {
                    if (str_contains($e->getMessage(), 'HTTP 401') || str_contains($e->getMessage(), 'HTTP 403')) {
                        throw $e; // auth failures are definitive
                    }
                    $streamsError = $e->getMessage();
                }

                // ── Step 1b: viewer count fallback from /sessions ─────────────
                if ($activeViewers === 0 && $streamsError === null) {
                    try {
                        $sessRaw = $this->flussonicApiService->request($server, 'sessions');
                        $sessList = $sessRaw['sessions'] ?? $sessRaw['items'] ?? $sessRaw['data'] ?? [];
                        if (empty($sessList) && isset($sessRaw[0])) {
                            $sessList = $sessRaw;
                        }
                        $activeViewers = is_array($sessList) ? count($sessList) : (int)($sessRaw['total'] ?? $sessRaw['count'] ?? 0);
                    } catch (Exception $e) {
                        // sessions endpoint optional — ignore errors
                    }
                }

                // ── Step 2: system metrics (CPU / RAM / disk) — soft-fail ────────
                $cpuUsage  = 0.0;
                $ramUsage  = 0.0;
                $diskUsage = 0.0;
                $sysSource = null;

                foreach (['monitoring/system', 'monitoring', 'cluster', 'server', 'sys'] as $ep) {
                    try {
                        $sysRaw = $this->flussonicApiService->request($server, $ep);

                        $cpuUsage = (float)($sysRaw['cpu_usage'] ?? $sysRaw['cpu'] ?? 0);

                        if (isset($sysRaw['ram_usage'])) {
                            $ramUsage = (float)$sysRaw['ram_usage'];
                        } elseif (isset($sysRaw['mem_usage'])) {
                            $ramUsage = (float)$sysRaw['mem_usage'];
                        } elseif (isset($sysRaw['mem_total']) && (float)$sysRaw['mem_total'] > 0) {
                            $ramUsage = round((float)($sysRaw['mem'] ?? $sysRaw['mem_used'] ?? 0) / (float)$sysRaw['mem_total'] * 100, 2);
                        } elseif (isset($sysRaw['memory']['used'], $sysRaw['memory']['total']) && $sysRaw['memory']['total'] > 0) {
                            $ramUsage = round($sysRaw['memory']['used'] / $sysRaw['memory']['total'] * 100, 2);
                        }

                        if (isset($sysRaw['disk_usage'])) {
                            $diskUsage = (float)$sysRaw['disk_usage'];
                        } elseif (isset($sysRaw['disk_total']) && (float)$sysRaw['disk_total'] > 0) {
                            $diskUsage = round((float)($sysRaw['disk'] ?? $sysRaw['disk_used'] ?? 0) / (float)$sysRaw['disk_total'] * 100, 2);
                        } elseif (isset($sysRaw['disk']['used'], $sysRaw['disk']['total']) && $sysRaw['disk']['total'] > 0) {
                            $diskUsage = round($sysRaw['disk']['used'] / $sysRaw['disk']['total'] * 100, 2);
                        }

                        // Prefer system-level network if streams didn't give us data
                        if ($netIn === 0 && $netOut === 0) {
                            $netIn  = (int)($sysRaw['bitrate_in']  ?? $sysRaw['network_in']  ?? $sysRaw['net_in']  ?? 0);
                            $netOut = (int)($sysRaw['bitrate_out'] ?? $sysRaw['network_out'] ?? $sysRaw['net_out'] ?? 0);
                        }

                        $sysSource = $ep;
                        break;
                    } catch (Exception $e) {
                        if (str_contains($e->getMessage(), 'HTTP 401') || str_contains($e->getMessage(), 'HTTP 403')) {
                            throw $e;
                        }
                        // try next endpoint
                    }
                }

                // ── Record whatever we have ──────────────────────────────────────
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
                $isPartial = $sysSource === null;
                $note = $sysSource === null
                    ? 'CPU/RAM/disk not available on this Flussonic server'
                    : "sys: {$sysSource}";
                if ($streamsError) {
                    $note .= " | streams error: {$streamsError}";
                }
                $results['details'][] = [
                    'server'    => $server->server_name,
                    'status'    => $isPartial ? 'partial' : 'ok',
                    'metric_id' => $metric->uuid,
                    'note'      => $note,
                ];
            } catch (Exception $e) {
                $results['failed']++;
                $results['details'][] = ['server' => $server->server_name, 'status' => 'error', 'error' => $e->getMessage()];
            }
        }

        return $results;
    }
}
