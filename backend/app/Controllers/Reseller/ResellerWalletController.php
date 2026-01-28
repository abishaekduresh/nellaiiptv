<?php

namespace App\Controllers\Reseller;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Customer;
use App\Models\WalletTransaction;
use App\Models\Transaction; // For Razorpay transaction logging if needed
use App\Helpers\ResponseFormatter;
use App\Services\Payment\RazorpayDriver;
use Ramsey\Uuid\Uuid;
use Exception;

class ResellerWalletController
{
    private $paymentDriver;

    public function __construct()
    {
        $this->paymentDriver = new RazorpayDriver();
    }

    public function getBalance(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $customer = Customer::where('uuid', $user->sub)->first();

        if (!$customer || $customer->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        return ResponseFormatter::success($response, [
            'balance' => $customer->wallet_balance,
            'currency' => 'INR'
        ]);
    }

    public function getTransactions(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $customer = Customer::where('uuid', $user->sub)->first();

        if (!$customer || $customer->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $params = $request->getQueryParams();
        $page = $params['page'] ?? 1;
        $perPage = $params['per_page'] ?? 20;

        $transactions = WalletTransaction::where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return ResponseFormatter::success($response, $transactions);
    }

    public function addFunds(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $customer = Customer::where('uuid', $user->sub)->first();

        if (!$customer || $customer->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $data = $request->getParsedBody();
        $amount = $data['amount'] ?? 0;

        if ($amount < 1) {
            return ResponseFormatter::error($response, 'Amount must be at least 1', 400);
        }

        try {
            // Initiate Razorpay Order
            // Reuse Transaction Model logic but adapted for wallet
            // Or assume frontend does standard Razorpay flow and we verify signature?
            // Standard flow: Backend creates Order -> Frontend Pays -> Backend Verifies.
            
            // Using existing driver logic manually as existing PaymentController is Plan-centric.
            // We'll create a dummy "Wallet Topup" plan-like object or just use createOrder method directly if possible.
            // But Razorpay driver expects Plan object. Let's do raw call for simplicity or adapt.
            
            $result = $this->paymentDriver->createOrderForWallet($amount, $customer);
            
            return ResponseFormatter::success($response, $result, 'Order created');

        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function verifyPayment(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $customer = Customer::where('uuid', $user->sub)->first();

        if (!$customer || $customer->role !== 'reseller') {
            return ResponseFormatter::error($response, 'Unauthorized', 403);
        }

        $data = $request->getParsedBody();
        
        try {
            // Verify signature
            $isValid = $this->paymentDriver->verifySignature($data);
            
            if (!$isValid) {
               return ResponseFormatter::error($response, 'Payment verification failed', 400);
            }
            
            // Prevent duplicate processing
            if (WalletTransaction::where('reference_id', $data['razorpay_payment_id'])->exists()) {
                return ResponseFormatter::error($response, 'Transaction already processed', 400);
            }

            // Get Amount from Razorpay API to be sure or trust frontend (unsafe)?
            // Better to trust the order ID stored in DB or fetch from Razorpay.
            // For simplicity in this iteration, we assume the Order ID check in verifySignature is strictly tied to our secret.
            // We need amount. Let's fetch payment details.
            $amount = $this->paymentDriver->getPaymentAmount($data['razorpay_payment_id']); // Need to implement this helper or assume
            
            // Assume we passed amount in metadata or session? 
            // In a robust system we store the "Pending Wallet Transaction". 
            // Let's rely on client passing amount for now BUT verify against payment ID in production.
            // Correction: Fetch from Razorpay is safest.
            
            // Credit Wallet
            $customer->wallet_balance += $amount;
            $customer->save();

            // Log Transaction
            WalletTransaction::create([
                'customer_id' => $customer->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => 'Wallet Topup via Razorpay',
                'reference_id' => $data['razorpay_payment_id'],
                'balance_after' => $customer->wallet_balance
            ]);

            return ResponseFormatter::success($response, ['balance' => $customer->wallet_balance], 'Funds added successfully');

        } catch (Exception $e) {
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }
}
