<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    protected $table = 'wallet_transactions';

    protected $fillable = [
        'customer_id',
        'type',
        'amount',
        'description',
        'reference_id',
        'balance_after',
        'created_at'
    ];

    public $timestamps = false;        
    
    // Auto-cast
    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'created_at' => 'datetime'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
