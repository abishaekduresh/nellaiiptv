<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Helpers\ResponseFormatter;
use App\Models\EmailLog;
use App\Models\Transaction;
use App\Models\Customer;
use App\Models\SubscriptionPlan;
use App\Models\WalletTransaction;
use App\Services\Payment\RazorpayDriver;
use Carbon\Carbon;
use Exception;

class WebhookController
{
    public function handleResend(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $type = $data['type'] ?? null;
        
        if (!$type || !isset($data['data']['email_id'])) {
            return ResponseFormatter::success($response, null, 'Ignored: No type or email_id');
        }

        $emailId = $data['data']['email_id'];
        $status = str_replace('email.', '', $type);

        try {
            $log = EmailLog::where('provider_id', $emailId)->first();
            
            if ($log) {
                $log->status = $status;
                $currentMeta = $log->metadata ?? [];
                $currentMeta['events'][] = [
                    'type' => $type,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
                $log->metadata = $currentMeta;
                $log->save();
                return ResponseFormatter::success($response, null, "Updated status to $status");
            }
            return ResponseFormatter::success($response, null, 'Email ID not found in logs');

        } catch (Exception $e) {
            error_log("Webhook Error: " . $e->getMessage());
            return ResponseFormatter::error($response, $e->getMessage(), 500);
        }
    }

    public function handleRazorpay(Request $request, Response $response): Response
    {
        $signature = $request->getHeaderLine('X-Razorpay-Signature');
        $payload = (string)$request->getBody();
        $secret = $_ENV['RAZORPAY_WEBHOOK_SECRET'] ?? '';

        if (!$signature) {
             return ResponseFormatter::error($response, 'Missing signature', 400);
        }

        $driver = new RazorpayDriver();
        
        try {
            if ($secret && !$driver->verifyWebhookSignature($payload, $signature, $secret)) {
                error_log("Razorpay Webhook: Invalid signature");
                return ResponseFormatter::error($response, 'Invalid signature', 400);
            }
        } catch (Exception $e) {
             error_log("Razorpay Webhook Verification Error: " . $e->getMessage());
             return ResponseFormatter::error($response, $e->getMessage(), 500);
        }

        $data = json_decode($payload, true);
        $event = $data['event'] ?? '';
        
        error_log("Razorpay Webhook Event Received: " . $event);

        try {
            switch ($event) {
                case 'order.paid':
                    $this->processOrderPaid($data['payload']['order']['entity']);
                    break;
                case 'payment.captured':
                    $this->processPaymentCaptured($data['payload']['payment']['entity']);
                    break;
                case 'payment.failed':
                    $this->processPaymentFailed($data['payload']['payment']['entity']);
                    break;
            }
        } catch (Exception $e) {
            error_log("Razorpay Webhook Processing Error ($event): " . $e->getMessage());
            // We return 200 even on error to stop Razorpay from retrying endlessly if it's a code error, 
            // but in some cases you might want retries. Let's return 200 for now.
        }

        return ResponseFormatter::success($response, null, 'Webhook processed');
    }

    private function processOrderPaid(array $orderEntity)
    {
        $orderId = $orderEntity['id'];
        $notes = $orderEntity['notes'] ?? [];
        $type = $notes['type'] ?? null;

        if ($type === 'wallet_topup') {
            $this->processWalletTopup($orderEntity);
            return;
        }

        $transaction = Transaction::where('gateway_order_id', $orderId)->first();
        
        if (!$transaction) {
            // Fallback to transaction_uuid from notes
            $txUuid = $notes['transaction_uuid'] ?? null;
            if ($txUuid) {
                $transaction = Transaction::where('uuid', $txUuid)->first();
            }
        }

        if (!$transaction || $transaction->status === 'success') {
            return;
        }

        // Update transaction status
        $transaction->update([
            'status' => 'success',
            'raw_response' => array_merge((array)$transaction->raw_response, ['webhook_order_paid' => $orderEntity])
        ]);

        // Activate Subscription
        $this->activateSubscription($transaction);
    }

    private function processWalletTopup(array $orderEntity)
    {
        $notes = $orderEntity['notes'] ?? [];
        $customerUuid = $notes['customer_uuid'] ?? null;
        $orderId = $orderEntity['id'];
        $amount = $orderEntity['amount_paid'] / 100;

        if (!$customerUuid) return;

        $customer = Customer::where('uuid', $customerUuid)->first();
        if (!$customer) return;

        // Prevent duplicate processing
        if (WalletTransaction::where('reference_id', $orderId)->exists()) {
            return;
        }

        // Credit Wallet
        $customer->wallet_balance += $amount;
        $customer->save();

        // Log Transaction
        WalletTransaction::create([
            'customer_id' => $customer->id,
            'type' => 'credit',
            'amount' => $amount,
            'description' => 'Wallet Topup via Razorpay (Webhook)',
            'reference_id' => $orderId,
            'balance_after' => $customer->wallet_balance
        ]);

        error_log("Wallet credited via Webhook for Customer: " . $customer->phone . " Amount: " . $amount);
    }

    private function processPaymentCaptured(array $paymentEntity)
    {
        $orderId = $paymentEntity['order_id'] ?? null;
        $paymentId = $paymentEntity['id'];
        
        if (!$orderId) {
            // Check if this is a wallet topup (might not have order_id if direct payment, but we usually use orders)
            // If it's a wallet topup, we might need to handle it.
            return;
        }

        $transaction = Transaction::where('gateway_order_id', $orderId)->first();

        if ($transaction) {
            if ($transaction->status !== 'success') {
                $transaction->update([
                    'status' => 'success',
                    'gateway_payment_id' => $paymentId,
                    'raw_response' => array_merge((array)$transaction->raw_response, ['webhook_payment_captured' => $paymentEntity])
                ]);
                $this->activateSubscription($transaction);
            }
        } else {
            // Check if it's a wallet transaction
            // We need a way to link Razorpay Order to Wallet. 
            // Since we don't store wallet orders yet, we can't easily update it here 
            // unless we start storing them or use notes.
        }
    }

    private function processPaymentFailed(array $paymentEntity)
    {
        $orderId = $paymentEntity['order_id'] ?? null;
        if (!$orderId) return;

        $transaction = Transaction::where('gateway_order_id', $orderId)->first();
        if ($transaction && $transaction->status === 'pending') {
            $transaction->update([
                'status' => 'failed',
                'error_message' => $paymentEntity['error_description'] ?? 'Payment failed',
                'raw_response' => array_merge((array)$transaction->raw_response, ['webhook_payment_failed' => $paymentEntity])
            ]);
        }
    }

    private function activateSubscription(Transaction $transaction)
    {
        $customer = $transaction->customer;
        $plan = $transaction->plan;

        if (!$customer || !$plan) return;

        $startFrom = ($customer->subscription_expires_at && $customer->subscription_expires_at > Carbon::now())
            ? Carbon::parse($customer->subscription_expires_at)
            : Carbon::now();

        $expiryDate = $startFrom->addDays($plan->duration);

        $customer->update([
            'subscription_plan_id' => $plan->id,
            'subscription_expires_at' => $expiryDate,
            'status' => 'active'
        ]);
        
        error_log("Subscription activated via Webhook for Customer: " . $customer->phone);
    }
}
