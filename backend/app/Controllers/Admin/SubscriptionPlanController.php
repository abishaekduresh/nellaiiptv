<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\SubscriptionPlan;
use App\Helpers\ResponseFormatter;
use Ramsey\Uuid\Uuid;

class SubscriptionPlanController
{
    public function index(Request $request, Response $response): Response
    {
        $plans = SubscriptionPlan::orderBy('price', 'asc')->get();
        return ResponseFormatter::success($response, $plans);
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Validation
        if (empty($data['name']) || !isset($data['price']) || !isset($data['duration'])) {
            return ResponseFormatter::error($response, 'Name, Price and Duration are required', 400);
        }

        try {
            $plan = new SubscriptionPlan();
            $plan->uuid = Uuid::uuid4()->toString();
            $plan->name = $data['name'];
            $plan->price = $data['price'];
            $plan->duration = $data['duration'];
            $plan->device_limit = $data['device_limit'] ?? 1;
            $plan->platform_access = $data['platform_access'] ?? []; // Array
            $plan->description = $data['description'] ?? null;
            $plan->status = $data['status'] ?? 'active';
            $plan->save();

            return ResponseFormatter::success($response, $plan, 'Subscription plan created successfully', 201);
        } catch (\Throwable $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function show(Request $request, Response $response, string $uuid): Response
    {
        $plan = SubscriptionPlan::where('uuid', $uuid)->first();
        if (!$plan) {
            return ResponseFormatter::error($response, 'Plan not found', 404);
        }
        return ResponseFormatter::success($response, $plan);
    }

    public function update(Request $request, Response $response, string $uuid): Response
    {
        $data = $request->getParsedBody();
        $plan = SubscriptionPlan::where('uuid', $uuid)->first();

        if (!$plan) {
            return ResponseFormatter::error($response, 'Plan not found', 404);
        }

        try {
            if (isset($data['name'])) $plan->name = $data['name'];
            if (isset($data['price'])) $plan->price = $data['price'];
            if (isset($data['duration'])) $plan->duration = $data['duration'];
            if (isset($data['device_limit'])) $plan->device_limit = $data['device_limit'];
            if (isset($data['platform_access'])) $plan->platform_access = $data['platform_access'];
            if (isset($data['description'])) $plan->description = $data['description'];
            if (isset($data['status'])) $plan->status = $data['status'];
            
            $plan->save();

            return ResponseFormatter::success($response, $plan, 'Subscription plan updated');
        } catch (\Throwable $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function delete(Request $request, Response $response, string $uuid): Response
    {
        $plan = SubscriptionPlan::where('uuid', $uuid)->first();
        if (!$plan) {
            return ResponseFormatter::error($response, 'Plan not found', 404);
        }

        // Optional: Check if any customer is using this plan?
        // simple approach: just delete, customers might have dangling reference or set null.
        // Better: soft delete or check count.
        // For MVP, if customers attached, maybe warn? using hasMany count.
        
        if ($plan->customers()->count() > 0) {
             return ResponseFormatter::error($response, 'Cannot delete plan because it is assigned to customers. Deactivate it instead.', 400);
        }

        $plan->delete();
        return ResponseFormatter::success($response, null, 'Subscription plan deleted');
    }
}
