<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ChannelService;
use App\Helpers\ResponseFormatter;

class StreamController
{
    private $channelService;
    private $debugInfo = [];

    public function __construct(ChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function checkStatus(Request $request, Response $response, array $args = []): Response
    {
        // Slim passes route parameters as request attributes
        $uuid = $request->getAttribute('uuid') ?? $args['uuid'] ?? null;

        error_log("StreamController::checkStatus called with UUID: " . ($uuid ?? 'NULL'));

        if (!$uuid) {
            error_log("StreamController::checkStatus ERROR: No UUID provided");
            return ResponseFormatter::error($response, 'Channel UUID is required', 400);
        }

        try {
            error_log("StreamController::checkStatus fetching channel: $uuid");
            $channel = $this->channelService->getOne($uuid);

            error_log("StreamController::checkStatus channel result: " . json_encode($channel));

            if (!$channel || !isset($channel->hls_url)) {
                error_log("StreamController::checkStatus ERROR: Channel not found or no HLS URL");
                return ResponseFormatter::error($response, 'Channel not found', 404);
            }

            error_log("StreamController::checkStatus HLS URL: " . $channel->hls_url);

            // Check if HLS stream is online
            $isOnline = $this->checkStreamStatus($channel->hls_url);

            error_log("StreamController::checkStatus result: is_online=" . ($isOnline ? 'true' : 'false'));

            return ResponseFormatter::success($response, [
                'is_online' => $isOnline,
                'channel_uuid' => $uuid,
                'debug' => $this->debugInfo
            ], 'Stream status checked successfully');
        } catch (\Exception $e) {
            error_log("StreamController::checkStatus EXCEPTION: " . $e->getMessage());
            return ResponseFormatter::error($response, 'Failed to check stream status: ' . $e->getMessage(), 500);
        }
    }

    private function checkStreamStatus(string $hlsUrl): bool
    {
        $hlsUrl = trim($hlsUrl);
        if (empty($hlsUrl)) {
            return false;
        }

        $this->debugInfo = []; // Reset debug info
        error_log("StreamController Checking URL: " . $hlsUrl);

        $check = function ($method) use ($hlsUrl) {
            $ch = curl_init($hlsUrl);
            curl_setopt($ch, CURLOPT_NOBODY, $method === 'HEAD');
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            curl_setopt($ch, CURLOPT_ENCODING, ''); // Handle compression
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Force IPv4
            
            // Disable SSL verification (trusted internal streams)
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

            if ($method === 'GET') {
                // Fetch only the first 1024 bytes to save bandwidth
                curl_setopt($ch, CURLOPT_RANGE, '0-1023');
            }

            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            $this->debugInfo[] = [
                'method' => $method,
                'http_code' => $httpCode,
                'error' => $error,
                'url' => $hlsUrl
            ];

            error_log("Stream Check [$method] URL: $hlsUrl | Code: $httpCode | Error: $error");

            return $httpCode;
        };

        // Try HEAD first
        $httpCode = $check('HEAD');

        // If HEAD is not 200 OK, try GET as a fallback for ANY other status
        // This covers 403, 405, 404 (sometimes false positive), 500, or 0 (timeout)
        if ($httpCode !== 200) {
            $httpCode = $check('GET');
        }

        return ($httpCode >= 200 && $httpCode < 400);
    }
}
