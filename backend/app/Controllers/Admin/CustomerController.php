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
        
        $query = Customer::query();
        
        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }

        if (isset($params['search'])) {
            $query->where(function($q) use ($params) {
                $q->where('name', 'LIKE', '%' . $params['search'] . '%')
                  ->orWhere('phone', 'LIKE', '%' . $params['search'] . '%');
            });
        }

        $customers = $query->paginate($perPage)->toArray();
        return ResponseFormatter::success($response, $customers);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $data = $request->getParsedBody() ?? [];

        try {
            $customer = Customer::where('uuid', $args['uuid'])->firstOrFail();
            
            if (isset($data['status'])) {
                $customer->status = $data['status'];
            }
            
            $customer->save();
            return ResponseFormatter::success($response, $customer, 'Customer updated');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        try {
            $customer = Customer::where('uuid', $args['uuid'])->firstOrFail();
            $customer->status = 'deleted';
            $customer->save();
            return ResponseFormatter::success($response, null, 'Customer deleted');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
