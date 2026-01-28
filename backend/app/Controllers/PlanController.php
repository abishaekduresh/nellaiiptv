<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\SubscriptionPlan;
use App\Helpers\ResponseFormatter;

class PlanController
{
    /**
     * Fetch all active subscription plans
     */
    public function index(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $role = 'customer'; // Default for guests
        
        if ($user && isset($user->sub)) {
            $customer = \App\Models\Customer::where('uuid', $user->sub)->first();
            if ($customer) {
                $role = $customer->role ?? 'customer';
            }
        }

        $plans = SubscriptionPlan::where('status', 'active')
            ->where(function($query) use ($role) {
                $query->where('show_to', 'both')
                      ->orWhere('show_to', $role);
            })
            ->orderBy('price', 'asc')
            ->get();
            
        return ResponseFormatter::success($response, $plans, 'Subscription plans retrieved successfully');
    }
}
