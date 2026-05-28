<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\MonitoringService;
use App\Helpers\ResponseFormatter;
use Exception;

class MonitoringController
{
    private MonitoringService $monitoringService;

    public function __construct(MonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $data = $this->monitoringService->getLatestPerServer();
            return ResponseFormatter::success($response, $data, 'Monitoring data retrieved');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function history(Request $request, Response $response, string $serverUuid): Response
    {
        try {
            $limit = (int)($request->getQueryParams()['limit'] ?? 24);
            $data  = $this->monitoringService->getHistory($serverUuid, $limit);
            return ResponseFormatter::success($response, $data, 'Monitoring history retrieved');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function record(Request $request, Response $response, string $serverUuid): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            $metric = $this->monitoringService->record($serverUuid, $data);
            return ResponseFormatter::success($response, $metric, 'Metric recorded', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function recordAll(Request $request, Response $response): Response
    {
        try {
            $results = $this->monitoringService->recordAllFromFlussonic();
            $msg     = "Recorded {$results['recorded']}/{$results['total']} servers";
            return ResponseFormatter::success($response, $results, $msg);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
