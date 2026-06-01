<?php

namespace App\Controllers\Cron;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\StreamServerPingService;
use App\Helpers\ResponseFormatter;
use Exception;

class PingServersCronController
{
    private StreamServerPingService $pingService;

    public function __construct(StreamServerPingService $pingService)
    {
        $this->pingService = $pingService;
    }

    /**
     * GET /api/cron/ping-servers
     *
     * Pings all active Flussonic stream servers and updates health_status.
     * Protected by CronSecretMiddleware.
     */
    public function ping(Request $request, Response $response): Response
    {
        try {
            $results = $this->pingService->pingAll();

            $message = "Pinged {$results['total']} server(s) — {$results['online']} online, {$results['offline']} offline.";

            return ResponseFormatter::success($response, $results, $message);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
