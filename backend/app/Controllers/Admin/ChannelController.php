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
        $channels = $this->channelService->getAll($filters);
        return ResponseFormatter::success($response, $channels);
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $errors = Validator::validate($data, [
            'required' => [['name'], ['hls_url'], ['state_id'], ['language_id']],
            'optional' => [['is_premium']]
        ]);

        if ($errors) {
            return ResponseFormatter::error($response, 'Validation failed', 400, $errors);
        }

        try {
            $channel = $this->channelService->create($data);
            return ResponseFormatter::success($response, $channel, 'Channel created', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $channel = $this->channelService->getOne($uuid);
            return ResponseFormatter::success($response, $channel);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 404);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            $channel = $this->channelService->update($uuid, $data);
            return ResponseFormatter::success($response, $channel, 'Channel updated');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->channelService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Channel deleted');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
