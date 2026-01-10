<?php
require 'backend/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Initialize Eloquent
$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => 'localhost',
    'database'  => 'nellai_iptv',
    'username'  => 'root',
    'password'  => '',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

$customer = \App\Models\Customer::where('phone', '9976607033')->first();

if ($customer) {
    echo "Customer Found: " . $customer->name . "\n";
    echo "Raw Expiry: " . $customer->getAttributes()['subscription_expires_at'] . "\n";
    echo "Expiry Object: " . json_encode($customer->subscription_expires_at) . "\n";
    
    if ($customer->subscription_plan_id) {
        $plan = \App\Models\SubscriptionPlan::find($customer->subscription_plan_id);
        echo "Plan Duration: " . $plan->duration . "\n";
    }
} else {
    echo "Customer not found.\n";
}
