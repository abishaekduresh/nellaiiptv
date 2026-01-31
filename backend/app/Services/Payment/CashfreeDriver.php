<?php

namespace App\Services\Payment;

use App\Models\Transaction;
use App\Models\SubscriptionPlan;
use App\Models\Customer;
use GuzzleHttp\Client;

class CashfreeDriver implements PaymentDriverInterface
{
    private $appId;
    private $secretKey;
    private $baseUrl;
    private $apiVersion = '2023-08-01';

    public function __construct()
    {
        $this->appId = $_ENV['CASHFREE_APP_ID'] ?? '';
        $this->secretKey = $_ENV['CASHFREE_SECRET_KEY'] ?? '';
        $mode = $_ENV['CASHFREE_MODE'] ?? 'sandbox';
        
        $this->baseUrl = ($mode === 'production') 
            ? 'https://api.cashfree.com/pg' 
            : 'https://sandbox.cashfree.com/pg';
    }

    public function createOrder(Customer $customer, SubscriptionPlan $plan, Transaction $transaction): array
    {
        if (!$this->appId || !$this->secretKey) {
            throw new \Exception("Cashfree keys not configured");
        }

        $client = new Client([
            'verify' => false // Disable SSL verification for WAMP/Local dev fix
        ]);
        
        $payload = [
            'order_id' => (string) $transaction->uuid,
            'order_amount' => (float) $transaction->amount,
            'order_currency' => $transaction->currency,
            'customer_details' => [
                'customer_id' => (string) $customer->uuid,
                'customer_email' => $customer->email ?? 'customer@example.com',
                'customer_phone' => (string) ($customer->phone ?? '9999999999'),
                'customer_name' => $customer->name ?? 'Customer'
            ],
            'order_meta' => [
                'return_url' => ($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000') . '/payment/status?order_id={order_id}',
                'notify_url' => ($_ENV['APP_URL'] ?? 'http://localhost/nellaiiptv/backend/public') . '/api/webhooks/cashfree'
            ],
            'order_note' => "Subscription for " . $plan->name
        ];

        try {
            $response = $client->post($this->baseUrl . '/orders', [
                'headers' => [
                    'x-client-id' => $this->appId,
                    'x-client-secret' => $this->secretKey,
                    'x-api-version' => $this->apiVersion,
                    'Content-Type' => 'application/json'
                ],
                'json' => $payload
            ]);

            $body = json_decode($response->getBody(), true);
            
            return [
                'gateway_order_id' => $body['cf_order_id'] ?? $transaction->uuid, // Cashfree might use our order_id or generate one? Usually uses ours if we send it.
                'payment_session_id' => $body['payment_session_id'],
                'raw' => $body
            ];
        } catch (\Exception $e) {
             throw new \Exception("Cashfree Order Creation Failed: " . $e->getMessage());
        }
    }

    public function verifyPayment(array $payload, Transaction $transaction): bool
    {
        if (!$this->appId || !$this->secretKey) {
            throw new \Exception("Cashfree keys not configured");
        }

        // For SDK flow, we should verify by fetching the order/payments from Cashfree
        // explicit use transaction uuid as we created order with this id
        $orderId = $transaction->uuid;
        
        $client = new Client([
            'verify' => false // Disable SSL verification for WAMP/Local dev fix
        ]);

        try {
            $response = $client->get($this->baseUrl . "/orders/$orderId/payments", [
                'headers' => [
                    'x-client-id' => $this->appId,
                    'x-client-secret' => $this->secretKey,
                    'x-api-version' => $this->apiVersion
                ]
            ]);

            $payments = json_decode($response->getBody(), true);

            if (!empty($payments)) {
                foreach ($payments as $payment) {
                    if ($payment['payment_status'] === 'SUCCESS') {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }
}
