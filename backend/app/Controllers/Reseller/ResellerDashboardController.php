<?php

namespace App\Controllers\Reseller;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;
use Illuminate\Database\Capsule\Manager as DB;

class ResellerDashboardController
{
    public function getStats(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $reseller = Customer::where('uuid', $user->sub)->first();

        if (!$reseller || $reseller->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        // 1. Total Customers (Created by this reseller)
        $totalCustomers = Customer::where('created_by_id', $reseller->id)
            ->where('created_by_type', 'reseller')
            ->count();

        // 2. Active Subscriptions
        $activeSubscriptions = Customer::where('created_by_id', $reseller->id)
            ->where('created_by_type', 'reseller')
            ->where('subscription_expires_at', '>', date('Y-m-d H:i:s'))
            ->count();

        // 3. Wallet Balance
        $walletBalance = (float) $reseller->wallet_balance;

        // 4. Recent Customers (Limit 5)
        $recentCustomers = Customer::with('plan')
            ->where('created_by_id', $reseller->id)
            ->where('created_by_type', 'reseller')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return ResponseFormatter::success($response, [
            'total_customers' => $totalCustomers,
            'active_subscriptions' => $activeSubscriptions,
            'wallet_balance' => $walletBalance,
            'recent_customers' => $recentCustomers
        ]);
    }
}
