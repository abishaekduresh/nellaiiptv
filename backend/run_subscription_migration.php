<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

use Illuminate\Database\Capsule\Manager as Capsule;

try {
    echo "Running Subscription Plans Migration...\n";

    // Create subscription_plans table
    if (!Capsule::schema()->hasTable('subscription_plans')) {
        Capsule::schema()->create('subscription_plans', function ($table) {
            $table->increments('id');
            $table->string('uuid', 36)->unique();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('duration')->default(30)->comment('Duration in days');
            $table->integer('device_limit')->default(1);
            $table->json('platform_access')->nullable()->comment('Array of allowed platforms');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
        echo "Created 'subscription_plans' table.\n";
    } else {
        echo "'subscription_plans' table already exists.\n";
    }

    // Add subscription fields to customers table
    if (Capsule::schema()->hasTable('customers')) {
        Capsule::schema()->table('customers', function ($table) {
            if (!Capsule::schema()->hasColumn('customers', 'subscription_plan_id')) {
                $table->integer('subscription_plan_id')->unsigned()->nullable()->after('status');
                // We add index for performance
                $table->index('subscription_plan_id');
            }
            if (!Capsule::schema()->hasColumn('customers', 'subscription_expires_at')) {
                $table->dateTime('subscription_expires_at')->nullable()->after('subscription_plan_id');
            }
        });
        echo "Updated 'customers' table with subscription fields.\n";
    } else {
        echo "'customers' table not found!\n";
    }

    echo "Migration completed successfully.\n";

} catch (\Exception $e) {
    echo "Migration Failed: " . $e->getMessage() . "\n";
    exit(1);
}
