<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';

use App\Models\Customer;

try {
    $customer = Customer::first();
    if ($customer) {
        echo "Customer found. Keys:\n";
        print_r(array_keys($customer->toArray()));
    } else {
        echo "No customers found, but query worked.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
