<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';

    protected $fillable = [
        'uuid',
        'customer_id',
        'plan_id',
        'gateway',
        'amount',
        'currency',
        'gateway_order_id',
        'gateway_payment_id',
        'gateway_signature',
        'status',
        'raw_response',
        'error_message'
    ];

    protected $casts = [
        'raw_response' => 'array',
        'amount' => 'decimal:2'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
}
