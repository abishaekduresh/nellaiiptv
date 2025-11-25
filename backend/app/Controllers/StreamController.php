<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\ChannelService;
use App\Helpers\ResponseFormatter;

class StreamController
{
    private $channelService;

    public function __construct(ChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function checkStatus(Request $request, Response $response, array $args = []): Response
    {
        // Slim passes route parameters as request attributes
        $uuid = $request->getAttribute('uuid') ?? $args['uuid'] ?? null;

        if (!$uuid) {
            return ResponseFormatter::error($response, 'Channel UUID is required', 400);
        }

        try {
            $channel = $this->channelService->getOne($uuid);

            if (!$channel || !isset($channel->hls_url)) {
                return ResponseFormatter::error($response, 'Channel not found', 404);
            }

            // Check if HLS stream is online
            $isOnline = $this->checkStreamStatus($channel->hls_url);

            return ResponseFormatter::success($response, [
                'is_online' => $isOnline,
                'channel_uuid' => $uuid
            ], 'Stream status checked successfully');
        } catch (\Exception $e) {
            return ResponseFormatter::error($response, 'Failed to check stream status: ' . $e->getMessage(), 500);
        }
    }

    private function checkStreamStatus(string $hlsUrl): bool
    {
        if (empty($hlsUrl)) {
            return false;
        }
        $ch = curl_init($hlsUrl);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // Disable SSL verification (trusted internal streams)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($httpCode >= 200 && $httpCode < 400);
    }
}
