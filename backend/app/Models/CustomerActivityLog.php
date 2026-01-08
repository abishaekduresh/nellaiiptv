<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerActivityLog extends Model
{
    protected $table = 'customer_activity_logs';
    
    protected $fillable = [
        'customer_id',
        'activity_type',
        'description',
        'ip_address',
        'user_agent',
        'platform',
        'created_at'
    ];

    public $timestamps = false; // We only use created_at, handled by DB default or manual set

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
