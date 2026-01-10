<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\SubscriptionPlan;
use App\Helpers\ResponseFormatter;
use Exception;

class CustomerController
{
    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $perPage = $params['per_page'] ?? 20;
        
        $query = Customer::with('plan')->where('status', '!=', 'deleted');
        
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

    public function getStats(Request $request, Response $response): Response
    {
        try {
            $total = Customer::where('status', '!=', 'deleted')->count();
            $active = Customer::where('status', 'active')->count();
            $inactive = Customer::where('status', 'inactive')->count();
            $blocked = Customer::where('status', 'blocked')->count();
            
            // Premium: Customers with a plan and expiry in future
            $premium = Customer::whereNotNull('subscription_plan_id')
                ->where('subscription_expires_at', '>', date('Y-m-d H:i:s'))
                ->where('status', 'active') // Only count active customers as premium? Or all? Usually active.
                ->count();

            $stats = [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'blocked' => $blocked,
                'premium' => $premium
            ];

            return ResponseFormatter::success($response, $stats);
        } catch (\Throwable $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function create(Request $request, Response $response): Response
    {
        error_log("CustomerController::create called");
        $data = $request->getParsedBody() ?? [];

        try {
            // Basic Validation
            if (empty($data['name']) || empty($data['phone'])) {
                return ResponseFormatter::error($response, 'Name and Phone are required', 400);
            }

            // check if phone already exists
            if (Customer::where('phone', $data['phone'])->exists()) {
                return ResponseFormatter::error($response, 'Phone number already exists', 400);
            }
            // check if email already exists (if provided)
            if (!empty($data['email']) && Customer::where('email', $data['email'])->exists()) {
                return ResponseFormatter::error($response, 'Email already exists', 400);
            }

            $customer = new Customer();
            $customer->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $customer->name = $data['name'];
            $customer->phone = $data['phone'];
            $customer->email = $data['email'] ?? null;
            $customer->status = $data['status'] ?? 'active';
            $customer->created_at = date('Y-m-d H:i:s');
            
            if (!empty($data['password'])) {
                $customer->password = password_hash($data['password'], PASSWORD_BCRYPT);
            }

            $customer->save();

            return ResponseFormatter::success($response, $customer, 'Customer created successfully', 201);

        } catch (\Throwable $e) {
            error_log("CustomerController::create Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        try {
            $customer = Customer::where('uuid', $uuid)->with('plan')->first();
            if (!$customer) {
                return ResponseFormatter::error($response, 'Customer not found', 404);
            }
            // Make hidden password visible if needed, but usually we don't return passwords.
            return ResponseFormatter::success($response, $customer);
        } catch (\Throwable $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
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
            
            // Update fields if present
            if (isset($data['name'])) $customer->name = $data['name'];
            if (isset($data['email'])) $customer->email = $data['email'];
            if (isset($data['phone'])) $customer->phone = $data['phone'];
            
            if (isset($data['status'])) {
                $status = $data['status'];
                if (!in_array($status, ['active', 'inactive', 'blocked'])) {
                    throw new Exception('Invalid status value');
                }
                $customer->status = $status;
            }

            if (isset($data['plan_uuid'])) {
                 if ($data['plan_uuid'] === null || $data['plan_uuid'] === '') {
                     $customer->subscription_plan_id = null;
                     $customer->subscription_expires_at = null;
                 } else {
                     $plan = SubscriptionPlan::where('uuid', $data['plan_uuid'])->first();
                     if ($plan) {
                         $customer->subscription_plan_id = $plan->id;
                         
                         // Auto-calculate expiry if not provided by user
                         if (empty($data['subscription_expires_at'])) {
                             try {
                                 $date = new \DateTime();
                                 $date->modify("+{$plan->duration} days");
                                 $customer->subscription_expires_at = $date->format('Y-m-d H:i:s');
                             } catch (\Exception $e) {
                                 // Fallback
                                 $customer->subscription_expires_at = date('Y-m-d H:i:s', strtotime("+30 days"));
                             }
                         }
                     }
                 }
            }
            // Allow manual override of expiry
            // Allow manual override of expiry if provided
            if (!empty($data['subscription_expires_at'])) {
                $customer->subscription_expires_at = $data['subscription_expires_at'];
            }

            if (!empty($data['password'])) {
                 $customer->password = password_hash($data['password'], PASSWORD_BCRYPT);
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

            // Hard delete or Soft delete? Code suggested status update before, keeping it consistent or verify if true delete is needed.
            // Previous code did: $customer->status = 'deleted';
            // If we want actual delete: $customer->delete();
            // Sticking to soft delete via status based on previous code context, but ideally user might want hard delete.
            // Let's do hard delete if requested "crud", but previous code had logic.
            // Wait, previous code: $customer->status = 'deleted'; 
            // I will keep it as soft delete for safety unless user complained.
            // Actually, for "CRUD" normally Delete means Delete. But let's check if the list filters "deleted".
            // Yes, index query has ->where('status', '!=', 'deleted');
             
            $customer->status = 'deleted';
            $customer->save();
            return ResponseFormatter::success($response, null, 'Customer deleted');
        } catch (\Throwable $e) {
            error_log("CustomerController::delete Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }
}
