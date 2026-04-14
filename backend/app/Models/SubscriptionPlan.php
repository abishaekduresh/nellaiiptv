<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $table = 'subscription_plans';

    protected $fillable = [
        'uuid',
        'name',
        'price',
        'reseller_price',
        'duration',
        'device_limit',
        'platform_access',
        'features',
        'description',
        'status',
        'is_popular',
        'show_to'
    ];

    protected $casts = [
        'platform_access' => 'array',
        'features' => 'array',
        'price' => 'decimal:2',
        'reseller_price' => 'decimal:2',
        'duration' => 'integer',
        'device_limit' => 'integer',
        'is_popular' => 'boolean'
    ];

    public function customers()
    {
        return $this->hasMany(Customer::class, 'subscription_plan_id');
    }
}
