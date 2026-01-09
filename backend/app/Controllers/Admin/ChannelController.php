<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\ChannelService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class ChannelController
{
    private $channelService;

    public function __construct(ChannelService $channelService)
    {
        $this->channelService = $channelService;
    }

    public function index(Request $request, Response $response): Response
    {
        $filters = $request->getQueryParams();
        try {
            $channels = $this->channelService->getAll($filters);
            return ResponseFormatter::success($response, $channels, 'Channels retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $rules = [
            'required' => [['name'], ['hls_url']],
            'optional' => [['allowed_platforms']]
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $channel = $this->channelService->create($data);
            return ResponseFormatter::success($response, $channel, 'Channel created successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $channel = $this->channelService->getOne($uuid);
            return ResponseFormatter::success($response, $channel, 'Channel retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Channel not found', 404);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            $channel = $this->channelService->update($uuid, $data);
            return ResponseFormatter::success($response, $channel, 'Channel updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->channelService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Channel deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
    public function getAnalytics(Request $request, Response $response, string $uuid): Response
    {
        try {
            $data = $this->channelService->getAnalytics($uuid);
            return ResponseFormatter::success($response, $data, 'Channel analytics retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
