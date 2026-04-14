<?php

namespace App\Services\Payment;

use App\Models\Transaction;
use App\Models\SubscriptionPlan;
use App\Models\Customer;
use Razorpay\Api\Api;

class RazorpayDriver implements PaymentDriverInterface
{
    private $api;

    public function __construct()
    {
        $keyId = $_ENV['RAZORPAY_KEY_ID'] ?? '';
        $keySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
        
        if ($keyId && $keySecret) {
            $this->api = new Api($keyId, $keySecret);
        }
    }

    public function createOrder(Customer $customer, SubscriptionPlan $plan, Transaction $transaction): array
    {
        if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }

        $orderData = [
            'receipt'         => (string) $transaction->uuid,
            'amount'          => (int) ($transaction->amount * 100), // Razorpay expects paise
            'currency'        => $transaction->currency,
            'payment_capture' => 1, // Auto capture
            'notes'           => [
                'transaction_uuid' => $transaction->uuid,
                'type' => 'plan_subscription'
            ]
        ];

        $razorpayOrder = $this->api->order->create($orderData);

        return [
            'gateway_order_id' => $razorpayOrder['id'],
            'raw' => $razorpayOrder->toArray()
        ];
    }

    public function verifyPayment(array $payload, Transaction $transaction): bool
    {
        if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }

        try {
            $attributes = [
                'razorpay_order_id' => $payload['razorpay_order_id'],
                'razorpay_payment_id' => $payload['razorpay_payment_id'],
                'razorpay_signature' => $payload['razorpay_signature']
            ];

            $this->api->utility->verifyPaymentSignature($attributes);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function createOrderForWallet(float $amount, Customer $customer): array
    {
        if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }

        $orderData = [
            'receipt'         => 'W-' . substr($customer->uuid, -12) . '-' . time(),
            'amount'          => (int) ($amount * 100), // Razorpay expects paise
            'currency'        => 'INR',
            'payment_capture' => 1,
            'notes'           => [
                'customer_uuid' => $customer->uuid,
                'type' => 'wallet_topup'
            ]
        ];

        $razorpayOrder = $this->api->order->create($orderData);

        return [
            'gateway_order_id' => $razorpayOrder['id'],
            'amount' => $amount,
            'key_id' => $_ENV['RAZORPAY_KEY_ID'] ?? '',
            'currency' => 'INR',
            'raw' => $razorpayOrder->toArray()
        ];
    }
    
    public function getPaymentAmount($paymentId)
    {
        if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }
        
        $payment = $this->api->payment->fetch($paymentId);
        return $payment['amount'] / 100;
    }
    
    public function verifySignature(array $attributes): bool
    {
         if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }
        try {
            $this->api->utility->verifyPaymentSignature($attributes);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function verifyWebhookSignature($payload, $signature, $secret): bool
    {
        if (!$this->api) {
            throw new \Exception("Razorpay keys not configured");
        }
        try {
            $this->api->utility->verifyWebhookSignature($payload, $signature, $secret);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
