<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\StreamServerService;
use App\Services\MistServer\MistAuthService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class StreamServerController
{
    private StreamServerService $streamServerService;
    private MistAuthService     $mistAuthService;

    public function __construct(
        StreamServerService $streamServerService,
        MistAuthService     $mistAuthService
    ) {
        $this->streamServerService = $streamServerService;
        $this->mistAuthService     = $mistAuthService;
    }

    public function index(Request $request, Response $response): Response
    {
        $filters = $request->getQueryParams();
        try {
            $servers = $this->streamServerService->getAll($filters);
            return ResponseFormatter::success($response, $servers, 'Stream servers retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $server = $this->streamServerService->getOne($uuid);
            return ResponseFormatter::success($response, $server, 'Stream server retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Stream server not found', 404);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $data = $this->castBooleans($data);

        $rules = [
            'required' => [
                ['server_name'],
                ['host_ipv4'],
                ['mist_api_host'],
                ['mist_server_username'],
                ['mist_server_password'],
            ],
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        // Validate MistServer credentials before persisting
        // Store the returned challenge + final hash alongside the encrypted password
        try {
            $mistAuth = $this->mistAuthService->validateCredentials(
                $data['mist_api_protocol']   ?? 'http',
                $data['mist_api_host'],
                (int)($data['mist_api_port'] ?? 4242),
                filter_var($data['ssl_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                $data['mist_server_username'],
                $data['mist_server_password']
            );
            $data['mist_challenge']  = $mistAuth['challenge'];
            $data['mist_final_hash'] = $mistAuth['final_hash'];
        } catch (Exception $e) {
            return ResponseFormatter::error(
                $response,
                'MistServer credential validation failed: ' . $e->getMessage(),
                422
            );
        }

        try {
            $server = $this->streamServerService->create($data);
            return ResponseFormatter::success($response, $server, 'Stream server created successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];

        $data = $this->castBooleans($data);

        // Protect immutable fields
        unset($data['uuid'], $data['id'], $data['created_at'], $data['deleted_at']);

        // If a new password is provided, validate credentials and refresh stored auth fields
        if (!empty($data['mist_server_password'])) {
            try {
                $mistAuth = $this->mistAuthService->validateCredentials(
                    $data['mist_api_protocol']   ?? 'http',
                    $data['mist_api_host']        ?? '',
                    (int)($data['mist_api_port'] ?? 4242),
                    filter_var($data['ssl_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    $data['mist_server_username'] ?? '',
                    $data['mist_server_password']
                );
                $data['mist_challenge']  = $mistAuth['challenge'];
                $data['mist_final_hash'] = $mistAuth['final_hash'];
            } catch (Exception $e) {
                return ResponseFormatter::error(
                    $response,
                    'MistServer credential validation failed: ' . $e->getMessage(),
                    422
                );
            }
        }

        try {
            $server = $this->streamServerService->update($uuid, $data);
            return ResponseFormatter::success($response, $server, 'Stream server updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->streamServerService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Stream server deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────

    private function castBooleans(array $data): array
    {
        $boolFields = [
            'gpu_enabled', 'supports_hls', 'supports_rtmp', 'supports_cmaf',
            'supports_webrtc', 'supports_srt', 'supports_transcoding',
            'api_whitelist_enabled', 'ssl_enabled',
        ];
        foreach ($boolFields as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN);
            }
        }
        return $data;
    }
}
