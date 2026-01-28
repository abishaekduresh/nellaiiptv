<?php

namespace App\Controllers\Admin;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Transaction;
use Illuminate\Database\Capsule\Manager as DB;
use App\Helpers\Validator;
use App\Helpers\ResponseFormatter;

class AdminTransactionController
{
    public function index(Request $request, Response $response): Response
    {
        // Keep existing index for backward compatibility if needed, or redirect logic
        return $this->getUnifiedLogs($request, $response);
    }

    public function getUnifiedLogs(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $search = $params['search'] ?? null;
        $status = $params['status'] ?? null; // success, failed, pending
        $type = $params['type'] ?? null; // payment, wallet
        $startDate = $params['start_date'] ?? null;
        $endDate = $params['end_date'] ?? null;
        $perPage = (int)($params['per_page'] ?? 15);
        $page = (int)($params['page'] ?? 1);

        // Subquery for Gateway Transactions
        $gatewayQuery = DB::table('transactions as t')
            ->join('customers as c', 't.customer_id', '=', 'c.id')
            ->leftJoin('subscription_plans as p', 't.plan_id', '=', 'p.id')
            ->select([
                DB::raw("'payment' as source_type"),
                DB::raw("CAST(t.uuid AS CHAR) as id"),
                't.created_at',
                't.amount',
                't.currency',
                DB::raw("CAST(t.status AS CHAR) as status"),
                DB::raw("CAST(t.gateway AS CHAR) as method"), // razorpay, etc
                DB::raw("CAST(t.gateway_order_id AS CHAR) as reference"),
                DB::raw("CAST(CONCAT('Plan: ', COALESCE(p.name, 'Unknown')) AS CHAR) as description"),
                DB::raw("CAST(c.name AS CHAR) as customer_name"),
                DB::raw("CAST(c.phone AS CHAR) as customer_phone"),
                DB::raw("CAST(c.uuid AS CHAR) as customer_uuid")
            ]);

        // Subquery for Wallet Transactions
        $walletQuery = DB::table('wallet_transactions as wt')
            ->join('customers as c', 'wt.customer_id', '=', 'c.id')
            ->select([
                DB::raw("'wallet' as source_type"),
                DB::raw("CAST(wt.id AS CHAR) as id"), // Cast ID to string to match UUID type approx
                'wt.created_at',
                'wt.amount',
                DB::raw("'INR' as currency"),
                DB::raw("'success' as status"), // Wallet txns are usually immediate success
                DB::raw("CAST(wt.type AS CHAR) as method"), // credit, debit
                DB::raw("CAST(wt.reference_id AS CHAR) as reference"),
                DB::raw("CAST(wt.description AS CHAR) as description"),
                DB::raw("CAST(c.name AS CHAR) as customer_name"),
                DB::raw("CAST(c.phone AS CHAR) as customer_phone"),
                DB::raw("CAST(c.uuid AS CHAR) as customer_uuid")
            ]);

        // Apply Search
        if ($search) {
            $gatewayQuery->where(function($q) use ($search) {
                $q->where('c.name', 'like', "%$search%")
                  ->orWhere('c.phone', 'like', "%$search%")
                  ->orWhere('t.gateway_order_id', 'like', "%$search%");
            });
            $walletQuery->where(function($q) use ($search) {
                $q->where('c.name', 'like', "%$search%")
                  ->orWhere('c.phone', 'like', "%$search%")
                  ->orWhere('wt.reference_id', 'like', "%$search%");
            });
        }

        // Apply Filters
        if ($status && $status !== 'all') {
            $gatewayQuery->where('t.status', $status);
            // For wallet, loosely map status
            if ($status === 'success') {
                $walletQuery->whereRaw("1=1");
            } else {
                $walletQuery->whereRaw("1=0"); // Wallet doesn't have failed/pending usually
            }
        }
        
        if ($type) {
            if ($type === 'payment') {
                $walletQuery->whereRaw("1=0");
            } elseif ($type === 'wallet') {
                $gatewayQuery->whereRaw("1=0");
            }
        }

        if ($startDate) {
            $gatewayQuery->whereDate('t.created_at', '>=', $startDate);
            $walletQuery->whereDate('wt.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $gatewayQuery->whereDate('t.created_at', '<=', $endDate);
            $walletQuery->whereDate('wt.created_at', '<=', $endDate);
        }

        // Combine
        $query = $gatewayQuery->unionAll($walletQuery);

        try {
            // Use explicit DB::select to handling bindings correctly
            $offset = ($page - 1) * $perPage;
            
            // Count Query
            $totalResult = DB::selectOne(
                "SELECT count(*) as total FROM ({$query->toSql()}) as combined_table", 
                $query->getBindings()
            );
            $total = $totalResult->total ?? 0;

            // Items Query
            $items = DB::select(
                "SELECT * FROM ({$query->toSql()}) as combined_table ORDER BY created_at DESC LIMIT ? OFFSET ?", 
                array_merge($query->getBindings(), [$perPage, $offset])
            );

            // Calculate Stats
            // Note: DB::table(...) creates a new query, unrelated to the above bindings issue
            $stats = [
                'total_revenue' => DB::table('transactions')->where('status', 'success')->sum('amount'),
                'wallet_credits' => DB::table('wallet_transactions')->where('type', 'credit')->sum('amount'),
                'wallet_debits' => DB::table('wallet_transactions')->where('type', 'debit')->sum('amount'),
            ];

            return ResponseFormatter::success($response, [
                'data' => $items,
                'total' => $total,
                'current_page' => $page,
                'last_page' => ceil($total / $perPage),
                'stats' => $stats
            ], 'Unified logs retrieved successfully');

        } catch (\Exception $e) {
            return ResponseFormatter::error($response, 'Failed to fetch logs: ' . $e->getMessage(), 500);
        }
    }
}
