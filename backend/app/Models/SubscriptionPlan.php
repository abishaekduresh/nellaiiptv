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
        'duration',
        'device_limit',
        'platform_access',
        'description',
        'status'
    ];

    protected $casts = [
        'platform_access' => 'array',
        'price' => 'decimal:2',
        'duration' => 'integer',
        'device_limit' => 'integer'
    ];

    public function customers()
    {
        return $this->hasMany(Customer::class, 'subscription_plan_id');
    }
}
