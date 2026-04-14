<?php

namespace App\Controllers\Reseller;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\SubscriptionPlan;
use App\Models\WalletTransaction;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;
use Exception;

class ResellerCustomerController
{
    /**
     * Search customer by exact phone number
     * Only returns customers with role='customer'
     */
    public function searchByPhone(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $reseller = Customer::where('uuid', $user->sub)->first();
        
        if (!$reseller || $reseller->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $params = $request->getQueryParams();
        $phone = $params['phone'] ?? '';

        if (empty($phone)) {
            return ResponseFormatter::error($response, 'Phone number is required', 400);
        }

        try {
            $customer = Customer::with('plan')
                ->where('phone', $phone)
                ->where('role', 'customer')
                ->first();

            if (!$customer) {
                return ResponseFormatter::success($response, null, 'No customer found', 404);
            }

            return ResponseFormatter::success($response, $customer, 'Customer found');
        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    /**
     * Create a new customer (reseller can only create customers, not other resellers)
     */
    public function createCustomer(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $reseller = Customer::where('uuid', $user->sub)->first();
        
        if (!$reseller || $reseller->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $data = $request->getParsedBody() ?? [];

        try {
            // Validation
            if (empty($data['name']) || empty($data['phone']) || empty($data['password'])) {
                return ResponseFormatter::error($response, 'Name, Phone, and Password are required', 400);
            }

            // Check if phone already exists
            if (Customer::where('phone', $data['phone'])->exists()) {
                return ResponseFormatter::error($response, 'Phone number already exists', 400);
            }

            // Check if email already exists (if provided)
            if (!empty($data['email']) && Customer::where('email', $data['email'])->exists()) {
                return ResponseFormatter::error($response, 'Email already exists', 400);
            }

            $customer = new Customer();
            $customer->uuid = Uuid::uuid4()->toString();
            $customer->name = $data['name'];
            $customer->phone = $data['phone'];
            $customer->email = $data['email'] ?? null;
            $customer->role = 'customer'; // Force customer role
            $customer->created_by_type = 'reseller'; // Created by reseller
            $customer->created_by_id = $reseller->id; // Reseller's customer ID
            $customer->status = 'active';
            $customer->password = password_hash($data['password'], PASSWORD_BCRYPT);
            $customer->created_at = date('Y-m-d H:i:s');

            $customer->save();

            return ResponseFormatter::success($response, $customer, 'Customer created successfully', 201);

        } catch (Exception $e) {
            error_log("ResellerCustomerController::createCustomer Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    /**
     * Assign a subscription plan to a customer
     */
    public function assignPlan(Request $request, Response $response, string $uuid): Response
    {
        $user = $request->getAttribute('user');
        $reseller = Customer::where('uuid', $user->sub)->first();
        
        if (!$reseller || $reseller->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $data = $request->getParsedBody() ?? [];

        try {
            $customer = Customer::where('uuid', $uuid)->where('role', 'customer')->first();

            if (!$customer) {
                return ResponseFormatter::error($response, 'Customer not found', 404);
            }

            if (empty($data['plan_uuid'])) {
                return ResponseFormatter::error($response, 'Plan UUID is required', 400);
            }

            $plan = SubscriptionPlan::where('uuid', $data['plan_uuid'])->first();

            if (!$plan) {
                return ResponseFormatter::error($response, 'Plan not found', 404);
            }

            // Wallet Deduction Logic
            $price = $plan->reseller_price > 0 ? $plan->reseller_price : $plan->price;
            
            if ($reseller->wallet_balance < $price) {
                return ResponseFormatter::error($response, 'Insufficient wallet balance', 400);
            }

            // Deduct Funds
            $reseller->wallet_balance -= $price;
            $reseller->save();

            // Log Transaction
            WalletTransaction::create([
                'customer_id' => $reseller->id,
                'type' => 'debit',
                'amount' => $price,
                'description' => "Plan Purchase: {$plan->name} for {$customer->name} ({$customer->phone})",
                'reference_id' => 'SUB-' . $customer->uuid,
                'balance_after' => $reseller->wallet_balance
            ]);

            // Assign plan
            $customer->subscription_plan_id = $plan->id;

            // Set expiration date
            if (!empty($data['expires_at'])) {
                $customer->subscription_expires_at = $data['expires_at'];
            } else {
                // Auto-calculate based on plan duration
                $customer->subscription_expires_at = date('Y-m-d H:i:s', strtotime("+{$plan->duration} days"));
            }

            $customer->save();

            // Reload with plan relationship
            $customer->load('plan');

            return ResponseFormatter::success($response, $customer, 'Plan assigned successfully');

        } catch (Exception $e) {
            error_log("ResellerCustomerController::assignPlan Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 400);
        }
    }

    /**
     * Get list of customers (role=customer only)
     */
    public function listCustomers(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $reseller = Customer::where('uuid', $user->sub)->first();
        
        if (!$reseller || $reseller->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        try {
            $params = $request->getQueryParams();
            $page = $params['page'] ?? 1;
            $perPage = $params['per_page'] ?? 20;

            $query = Customer::with('plan')
                ->where('role', 'customer')
                ->where('created_by_type', 'reseller')
                ->where('created_by_id', $reseller->id);

            // Search
            if (isset($params['search'])) {
                $query->where(function($q) use ($params) {
                    $q->where('name', 'LIKE', '%' . $params['search'] . '%')
                      ->orWhere('phone', 'LIKE', '%' . $params['search'] . '%');
                });
            }

            $customers = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return ResponseFormatter::success($response, $customers);

        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
