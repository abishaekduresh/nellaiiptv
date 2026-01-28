<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';
    protected $fillable = ['uuid', 'name', 'email', 'phone', 'role', 'created_by_type', 'created_by_id', 'password', 'status', 'reset_token', 'reset_token_expiry', 'subscription_plan_id', 'subscription_expires_at', 'wallet_balance', 'created_at'];
    public $timestamps = false;
    // const CREATED_AT = 'created_at';
    // const UPDATED_AT = null;

    protected $hidden = ['password'];

    protected $casts = [
        'subscription_expires_at' => 'datetime',
        'wallet_balance' => 'decimal:2'
    ];

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }
}
