<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\Admin\TenantService;
use App\Helpers\ResponseFormatter;
use App\Helpers\Validator;
use Exception;

class TenantController
{
    private TenantService $tenantService;

    public function __construct(TenantService $tenantService)
    {
        $this->tenantService = $tenantService;
    }

    public function index(Request $request, Response $response): Response
    {
        try {
            $tenants = $this->tenantService->getAll($request->getQueryParams());
            return ResponseFormatter::success($response, $tenants, 'Tenants retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $tenant = $this->tenantService->getOne($uuid);
            return ResponseFormatter::success($response, $tenant, 'Tenant retrieved successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, 'Tenant not found', 404);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];

        $rules = [
            'required' => [
                ['company_name'],
                ['email'],
            ],
        ];

        $errors = Validator::validate($data, $rules);
        if ($errors) return ResponseFormatter::error($response, 'Validation failed', 400, $errors);

        try {
            $tenant = $this->tenantService->create($data);
            return ResponseFormatter::success($response, $tenant, 'Tenant created successfully', 201);
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody() ?? [];
        unset($data['uuid'], $data['id'], $data['created_at'], $data['deleted_at']);

        try {
            $tenant = $this->tenantService->update($uuid, $data);
            return ResponseFormatter::success($response, $tenant, 'Tenant updated successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        try {
            $this->tenantService->delete($uuid);
            return ResponseFormatter::success($response, null, 'Tenant deleted successfully');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
