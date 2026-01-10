<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';
    protected $fillable = ['uuid', 'name', 'email', 'phone', 'password', 'status', 'reset_token', 'reset_token_expiry', 'subscription_plan_id', 'subscription_expires_at', 'created_at'];
    public $timestamps = false;
    // const CREATED_AT = 'created_at';
    // const UPDATED_AT = null;

    protected $hidden = ['password'];

    protected $casts = [
        'subscription_expires_at' => 'datetime'
    ];

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }
}
