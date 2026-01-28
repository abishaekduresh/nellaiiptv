<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\WalletTransaction;
use App\Helpers\ResponseFormatter;
use Exception;

class AdminWalletController
{
    public function topupWallet(Request $request, Response $response, string $uuid): Response
    {
        // Admin Auth is handled by Middleware
        
        $customer = Customer::where('uuid', $uuid)->first();
        if (!$customer) {
            return ResponseFormatter::error($response, 'Customer not found', 404);
        }

        if ($customer->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Customer is not a reseller', 400);
        }

        $data = $request->getParsedBody();
        $amount = $data['amount'] ?? 0;
        $description = $data['description'] ?? 'Admin Manual Credit';

        if (!is_numeric($amount) || $amount <= 0) {
            return ResponseFormatter::error($response, 'Invalid amount', 400);
        }

        try {
            $customer->wallet_balance += $amount;
            $customer->save();

            WalletTransaction::create([
                'customer_id' => $customer->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => $description,
                'reference_id' => 'ADMIN-' . time(), // Simple reference
                'balance_after' => $customer->wallet_balance
            ]);

            return ResponseFormatter::success($response, ['balance' => $customer->wallet_balance], 'Wallet credited successfully');

        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function getWalletTransactions(Request $request, Response $response, string $uuid): Response
    {
        $customer = Customer::where('uuid', $uuid)->first();
        if (!$customer) {
            return ResponseFormatter::error($response, 'Customer not found', 404);
        }

        $params = $request->getQueryParams();
        $page = $params['page'] ?? 1;
        $perPage = $params['per_page'] ?? 10;

        $transactions = WalletTransaction::where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return ResponseFormatter::success($response, $transactions);
    }
}
