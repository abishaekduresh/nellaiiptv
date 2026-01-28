<?php

namespace App\Controllers\Api;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Transaction;
use App\Models\SubscriptionPlan;
use App\Models\Customer;
use App\Helpers\ResponseFormatter;
use App\Services\Payment\RazorpayDriver;
use Ramsey\Uuid\Uuid;

class PaymentController
{
    private $drivers = [];

    public function __construct()
    {
        // Register drivers
        $this->drivers['razorpay'] = new RazorpayDriver();
    }

    public function createOrder(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        if (!$user) {
            return ResponseFormatter::error($response, 'Unauthorized', 401);
        }

        $data = $request->getParsedBody();
        $planUuid = $data['plan_uuid'] ?? '';
        $gateway = $data['gateway'] ?? 'razorpay';

        if (!isset($this->drivers[$gateway])) {
            return ResponseFormatter::error($response, 'Invalid payment gateway');
        }

        $plan = SubscriptionPlan::where('uuid', $planUuid)->first();
        if (!$plan) {
            return ResponseFormatter::error($response, 'Plan not found');
        }

        $customer = Customer::where('uuid', $user->sub)->first();
        if (!$customer) {
            return ResponseFormatter::error($response, 'Customer not found');
        }

        try {
            // Create pending transaction record
            $transaction = Transaction::create([
                'uuid' => Uuid::uuid4()->toString(),
                'customer_id' => $customer->id,
                'plan_id' => $plan->id,
                'gateway' => $gateway,
                'amount' => $plan->price,
                'currency' => 'INR',
                'status' => 'pending'
            ]);

            $driver = $this->drivers[$gateway];
            $order = $driver->createOrder($customer, $plan, $transaction);

            $transaction->update([
                'gateway_order_id' => $order['gateway_order_id'],
                'raw_response' => $order['raw']
            ]);

            return ResponseFormatter::success($response, [
                'order_id' => $order['gateway_order_id'],
                'transaction_uuid' => $transaction->uuid,
                'amount' => $transaction->amount * 100, // For frontend
                'currency' => $transaction->currency,
                'key_id' => $_ENV['RAZORPAY_KEY_ID'] ?? ''
            ], 'Order created successfully');

        } catch (\Exception $e) {
            return ResponseFormatter::error($response, 'Payment initialization failed: ' . $e->getMessage());
        }
    }

    public function verifyPayment(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $transactionUuid = $data['transaction_uuid'] ?? '';
        $gateway = $data['gateway'] ?? 'razorpay';

        $transaction = Transaction::where('uuid', $transactionUuid)->first();
        if (!$transaction) {
            return ResponseFormatter::error($response, 'Transaction not found');
        }

        if (!isset($this->drivers[$gateway])) {
            return ResponseFormatter::error($response, 'Invalid payment gateway');
        }

        try {
            $driver = $this->drivers[$gateway];
            $isValid = $driver->verifyPayment($data, $transaction);

            if ($isValid) {
                // Update transaction
                $transaction->update([
                    'status' => 'success',
                    'gateway_payment_id' => $data['razorpay_payment_id'] ?? null,
                    'gateway_signature' => $data['razorpay_signature'] ?? null,
                    'raw_response' => array_merge((array)$transaction->raw_response, ['verification' => $data])
                ]);

                // Update customer subscription
                $customer = $transaction->customer;
                $plan = $transaction->plan;
                
                // Calculate expiry: if already subscribed and not expired, extend. else start from now.
                $startFrom = ($customer->subscription_expires_at && $customer->subscription_expires_at > \Carbon\Carbon::now()) 
                    ? $customer->subscription_expires_at 
                    : \Carbon\Carbon::now();
                
                $expiryDate = $startFrom->addDays($plan->duration);

                $customer->update([
                    'subscription_plan_id' => $plan->id,
                    'subscription_expires_at' => $expiryDate,
                    'status' => 'active'
                ]);

                return ResponseFormatter::success($response, null, 'Payment verified and subscription activated');
            } else {
                $transaction->update([
                    'status' => 'failed',
                    'error_message' => 'Signature verification failed'
                ]);
                return ResponseFormatter::error($response, 'Payment verification failed');
            }

        } catch (\Exception $e) {
            return ResponseFormatter::error($response, 'Verification error: ' . $e->getMessage());
        }
    }
}
