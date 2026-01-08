<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerSession extends Model
{
    protected $table = 'customer_sessions';
    
    protected $fillable = [
        'customer_id',
        'session_token',
        'device_name',
        'platform',
        'ip_address',
        'created_at',
        'last_active'
    ];

    public $timestamps = false; // We handle timestamps manually or rely on DB defaults

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
