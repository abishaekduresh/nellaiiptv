<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

use App\Models\Customer;

$phone = '9976607033'; 
$customer = Customer::where('phone', $phone)->first();

if ($customer) {
    echo "Found Customer: {$customer->name}\n";
    echo "Current Expiry: " . ($customer->subscription_expires_at ?? 'NULL') . "\n";
    
    // Fix: Set to NULL if it looks invalid or if user wants us to clear it
    // In this case, since plan is effectively 'No Plan' (null id), we force null.
    if (!$customer->subscription_plan_id) {
        $customer->subscription_expires_at = null;
        $customer->save();
        echo "FIXED: Set subscription_expires_at to NULL.\n";
    }
    
    // Verify
    $customer->refresh();
    echo "New Expiry: " . ($customer->subscription_expires_at ?? 'NULL') . "\n";
} else {
    echo "Customer not found.\n";
}
