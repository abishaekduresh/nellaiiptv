<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

use App\Models\Customer;
use App\Models\SubscriptionPlan;

// Phone number from user screenshot
$phone = '9976607033'; 

$customer = Customer::where('phone', $phone)->first();

if ($customer) {
    echo "Customer Found: " . $customer->name . "\n";
    // Get raw attribute to see what's actually in DB
    $rawExpiry = $customer->getAttributes()['subscription_expires_at'];
    echo "Raw Expiry (DB): " . ($rawExpiry ?? 'NULL') . "\n";
    
    // Check interpreted value
    echo "Expiry Object: " . json_encode($customer->subscription_expires_at) . "\n";
    
    // Check Assigned Plan
    if ($customer->subscription_plan_id) {
        $plan = SubscriptionPlan::find($customer->subscription_plan_id);
        if ($plan) {
            echo "Plan: " . $plan->name . "\n";
            echo "Plan Duration: " . $plan->duration . "\n";
        } else {
            echo "Plan ID {$customer->subscription_plan_id} not found.\n";
        }
    } else {
        echo "No Plan ID assigned.\n";
    }
} else {
    echo "Customer with phone $phone not found.\n";
}
