<?php

namespace App\Services\Admin;

use App\Models\StreamServer;
use App\Services\Flussonic\FlussonicApiService;
use Exception;

class StreamServerPingService
{
    private FlussonicApiService $flussonicApiService;

    public function __construct(FlussonicApiService $flussonicApiService)
    {
        $this->flussonicApiService = $flussonicApiService;
    }

    /**
     * Ping all active stream servers and update health_status + last_ping_at.
     */
    public function pingAll(): array
    {
        $servers = StreamServer::whereNull('deleted_at')
            ->where('status', 'active')
            ->get();

        $results = [
            'total'   => 0,
            'online'  => 0,
            'offline' => 0,
            'details' => [],
        ];

        foreach ($servers as $server) {
            $results['total']++;
            $detail = $this->pingOne($server);
            if ($detail['health_status'] === 'online') {
                $results['online']++;
            } else {
                $results['offline']++;
            }
            $results['details'][] = $detail;
        }

        return $results;
    }

    /**
     * Ping a single server and persist the result.
     */
    public function pingOne(StreamServer $server): array
    {
        $online = false;
        $error  = null;

        try {
            $this->flussonicApiService->request($server, 'monitoring/liveness');
            $online = true;
        } catch (Exception $e) {
            $error = $e->getMessage();
        }

        $server->health_status = $online ? 'online' : 'offline';
        $server->last_ping_at  = date('Y-m-d H:i:s');
        $server->save();

        return [
            'uuid'          => $server->uuid,
            'server_name'   => $server->server_name,
            'health_status' => $server->health_status,
            'last_ping_at'  => $server->last_ping_at,
            'error'         => $error,
        ];
    }
}
