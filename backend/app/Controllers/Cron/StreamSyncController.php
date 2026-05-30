<?php

namespace App\Controllers\Cron;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\StreamService;
use App\Helpers\ResponseFormatter;
use Exception;

class StreamSyncController
{
    private StreamService $streamService;

    public function __construct(StreamService $streamService)
    {
        $this->streamService = $streamService;
    }

    /**
     * POST /api/cron/sync-streams
     *
     * Syncs streams from all active + online Flussonic servers.
     * Protected by CronSecretMiddleware (X-Cron-Secret header or ?secret= param).
     *
     * Optional query param: ?server_uuid=<uuid>  — limit sync to one server.
     */
    public function syncStreams(Request $request, Response $response): Response
    {
        $serverUuid = $request->getQueryParams()['server_uuid'] ?? null;

        try {
            $result = $this->streamService->syncFromServers($serverUuid ?: null);

            $message = "Sync complete — {$result['created']} created, {$result['updated']} updated.";
            if (!empty($result['errors'])) {
                $message .= ' ' . count($result['errors']) . ' server error(s).';
            }

            return ResponseFormatter::success($response, $result, $message);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
