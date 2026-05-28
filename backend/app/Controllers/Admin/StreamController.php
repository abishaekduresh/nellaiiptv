<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\StreamService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class StreamController
{
    private StreamService $streamService;

    public function __construct(StreamService $streamService)
    {
        $this->streamService = $streamService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $streams = $this->streamService->getAll($request->getQueryParams());
            return ResponseFormatter::success($response, $streams, 'Streams retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $stream = $this->streamService->getOne($uuid);
            return ResponseFormatter::success($response, $stream, 'Stream retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Stream not found', 404);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $rules = [
            'required' => [
                ['server_uuid'],
                ['stream_name'],
                ['input_url'],
            ],
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $stream = $this->streamService->create($data);
            return ResponseFormatter::success($response, $stream, 'Stream created successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];
        unset($data['uuid'], $data['id'], $data['created_at'], $data['deleted_at']);

        try {
            $stream = $this->streamService->update($uuid, $data);
            return ResponseFormatter::success($response, $stream, 'Stream updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->streamService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Stream deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
