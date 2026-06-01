<?php

namespace App\Controllers\Cron;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\MonitoringService;
use App\Helpers\ResponseFormatter;
use Exception;

class RecordMonitoringCronController
{
    private MonitoringService $monitoringService;

    public function __construct(MonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }

    /**
     * GET /api/cron/record-monitoring
     *
     * Records a metrics snapshot for all active Flussonic servers.
     * Protected by CronSecretMiddleware.
     */
    public function record(Request $request, Response $response): Response
    {
        try {
            $results = $this->monitoringService->recordAllFromFlussonic();

            $message = "Recorded {$results['recorded']}/{$results['total']} servers.";

            return ResponseFormatter::success($response, $results, $message);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
