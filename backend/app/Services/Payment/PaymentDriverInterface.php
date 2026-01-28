<?php

namespace App\Services\Payment;

use App\Models\Transaction;
use App\Models\SubscriptionPlan;
use App\Models\Customer;

interface PaymentDriverInterface
{
    /**
     * Create an order in the gateway
     */
    public function createOrder(Customer $customer, SubscriptionPlan $plan, Transaction $transaction): array;

    /**
     * Verify the payment signature/payload
     */
    public function verifyPayment(array $payload, Transaction $transaction): bool;
}
