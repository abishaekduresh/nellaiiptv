<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\AdService;
use App\Helpers\ResponseFormatter;
use Exception;
// use Illuminate\Support\Collection;

class AdController
{
    private $adService;

    public function __construct(AdService $adService)
    {
        $this->adService = $adService;
    }

    public function index(Request $request, Response $response): Response
    {
        $type = $request->getQueryParams()['type'] ?? null;

        // ads returned as array → convert to collection
        $ads = collect($this->adService->getAds($type));

        // Compute next_loop_start_sec based on each ad's run_time_sec + idle_time_sec
        $nextLoopStart = $ads->map(function ($ad) {
            return $ad['run_time_sec'] + $ad['idle_time_sec'];
        })->max();

        $payload = [
            'next_loop_start_sec' => $nextLoopStart,
            'ads' => $ads
        ];

        return ResponseFormatter::success($response, $payload, 'Ads retrieved successfully');
    }

    public function impression(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->adService->recordImpression($uuid);
            return ResponseFormatter::success($response, null, 'Ad impression recorded');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }
}
