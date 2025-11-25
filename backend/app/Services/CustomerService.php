<?php

namespace App\Services;

use App\Models\Customer;
use Exception;

class CustomerService
{
    public function getProfile(string $uuid): Customer
    {
        $customer = Customer::where('uuid', $uuid)->first();
        if (!$customer) {
            throw new Exception('Customer not found');
        }
        return $customer;
    }

    public function updateProfile(string $uuid, array $data): Customer
    {
        $customer = Customer::where('uuid', $uuid)->first();
        if (!$customer) {
            throw new Exception('Customer not found');
        }

        if (isset($data['name'])) {
            $customer->name = $data['name'];
        }
        
        // Phone update logic could be complex (verification), skipping for now or allowing direct update
        if (isset($data['phone'])) {
             if (Customer::where('phone', $data['phone'])->where('uuid', '!=', $uuid)->exists()) {
                throw new Exception('Phone number already in use');
             }
             $customer->phone = $data['phone'];
        }

        $customer->save();
        return $customer;
    }

    public function deleteCustomer(string $uuid): void
    {
        $customer = Customer::where('uuid', $uuid)->first();
        if (!$customer) {
            throw new Exception('Customer not found');
        }
        
        $customer->status = 'deleted';
        $customer->save();
    }
}
