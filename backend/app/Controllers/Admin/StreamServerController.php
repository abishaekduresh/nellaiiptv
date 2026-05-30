<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\StreamServerService;
use App\Services\Admin\StreamServerPingService;
use App\Services\Flussonic\FlussonicApiService;
use App\Helpers\EncryptionHelper;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use App\Models\StreamServer;
use Exception;

class StreamServerController
{
    private StreamServerService  $streamServerService;
    private FlussonicApiService  $flussonicApiService;
    private StreamServerPingService $streamServerPingService;

    public function __construct(
        StreamServerService $streamServerService,
        FlussonicApiService $flussonicApiService,
        StreamServerPingService $streamServerPingService
    ) {
        $this->streamServerService     = $streamServerService;
        $this->flussonicApiService     = $flussonicApiService;
        $this->streamServerPingService = $streamServerPingService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $servers = $this->streamServerService->getAll($request->getQueryParams());
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

        $rules = [
            'required' => [
                ['server_name'],
                ['server_host_ip'],
                ['username'],
                ['password_encrypted'],
            ],
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

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

        // Protect immutable fields
        unset($data['uuid'], $data['id'], $data['created_at'], $data['deleted_at']);

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

    public function pingAll(Request $request, Response $response): Response
    {
        try {
            $results = $this->streamServerPingService->pingAll();
            $msg     = "Pinged {$results['total']} server(s): {$results['online']} online, {$results['offline']} offline";
            return ResponseFormatter::success($response, $results, $msg);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function testConnection(Request $request, Response $response): Response
    {
        $data     = $request->getParsedBody() ?? [];
        // test_host is the resolved host the frontend wants to test against (IP or domain).
        // Falls back to server_host_ip for backwards compatibility.
        $host     = trim($data['test_host']         ?? $data['server_host_ip'] ?? '');
        $protocol = trim($data['protocol']          ?? 'http');
        $port     = (int)($data['api_port']         ?? 8080);
        $version  = trim($data['api_version']       ?? 'v3');
        $user     = trim($data['username']          ?? '');
        $pass     = trim($data['password_encrypted'] ?? '');
        $bearer   = trim($data['bearer_token']      ?? '');
        $uuid     = trim($data['uuid']              ?? '');

        if (!in_array($protocol, ['http', 'https'])) $protocol = 'http';

        if ($host === '') {
            return ResponseFormatter::error($response, 'Server host is required.', 400);
        }

        // Edit mode: password/bearer are blank because the backend hides them.
        // Load the stored (encrypted) credentials from the DB and decrypt them.
        if ($bearer === '' && $pass === '' && $uuid !== '') {
            $stored = StreamServer::where('uuid', $uuid)->whereNull('deleted_at')->first();
            if ($stored) {
                if (!empty($stored->bearer_token)) {
                    $bearer = EncryptionHelper::decrypt($stored->bearer_token);
                } elseif (!empty($stored->password_encrypted)) {
                    $pass = EncryptionHelper::decrypt($stored->password_encrypted);
                    if ($user === '') $user = $stored->username;
                }
            }
        }

        try {
            if ($bearer !== '') {
                $this->flussonicApiService->validateWithScheme($protocol, $host, $port, $version, null, null, $bearer);
            } else {
                if ($user === '' || $pass === '') {
                    return ResponseFormatter::error($response, 'Username and password are required when no bearer token is provided.', 400);
                }
                $this->flussonicApiService->validateWithScheme($protocol, $host, $port, $version, $user, $pass, null);
            }

            $livenessUrl = $this->flussonicApiService->buildUrl($host, $port, $version, 'monitoring/liveness', $protocol);

            return ResponseFormatter::success($response, [
                'url'      => $livenessUrl,
                'scheme'   => $protocol,
            ], 'Connection successful — Flussonic server is reachable and credentials are valid.');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 422);
        }
    }
}
