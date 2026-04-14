<?php

namespace App\Interfaces;

interface PaymentGatewayInterface
{
    /**
     * Create a new order in the gateway.
     * 
     * @param float $amount
     * @param string $currency
     * @param string $receipt
     * @return array Order data from gateway
     */
    public function createOrder(float $amount, string $currency, string $receipt): array;

    /**
     * Verify a payment signature/payload.
     * 
     * @param array $payload
     * @return bool
     */
    public function verifyPayment(array $payload): bool;
}
