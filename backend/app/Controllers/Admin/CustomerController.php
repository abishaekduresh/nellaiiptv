<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;
use Exception;

class CustomerController
{
    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $perPage = $params['per_page'] ?? 20;
        
        $query = Customer::query()->where('status', '!=', 'deleted');
        
        if (isset($params['status']) && $params['status'] !== 'all') {
            $query->where('status', $params['status']);
        }

        if (isset($params['search'])) {
            $query->where(function($q) use ($params) {
                $q->where('name', 'LIKE', '%' . $params['search'] . '%')
                  ->orWhere('phone', 'LIKE', '%' . $params['search'] . '%');
            });
        }

        $sortBy = $params['sort_by'] ?? 'id';
        $sortOrder = $params['sort_order'] ?? 'desc';
        
        $allowedSorts = ['id', 'name', 'created_at', 'status'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'id';
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) $sortOrder = 'desc';

        $customers = $query->orderBy($sortBy, $sortOrder)->paginate($perPage)->toArray();
        return ResponseFormatter::success($response, $customers);
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        error_log("CustomerController::update called for UUID: " . $uuid);
        $data = $request->getParsedBody() ?? [];

        try {
            $customer = Customer::where('uuid', $uuid)->first();

            if (!$customer) {
                return ResponseFormatter::error($response, 'Customer not found', 404);
            }
            
            if (isset($data['status'])) {
                $status = $data['status'];
                if (!in_array($status, ['active', 'inactive', 'blocked'])) {
                    throw new Exception('Invalid status value');
                }
                $customer->status = $status;
            }
            
            $customer->save();
            return ResponseFormatter::success($response, $customer, 'Customer updated');
        } catch (\Throwable $e) {
            error_log("CustomerController::update Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400); // 400 or 500
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        error_log("CustomerController::delete called for UUID: " . $uuid);
        try {
            $customer = Customer::where('uuid', $uuid)->first();
            
            if (!$customer) {
                return ResponseFormatter::error($response, 'Customer not found', 404);
            }

            $customer->status = 'deleted';
            $customer->save();
            return ResponseFormatter::success($response, null, 'Customer deleted');
        } catch (\Throwable $e) {
            error_log("CustomerController::delete Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
