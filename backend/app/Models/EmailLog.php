<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    protected $table = 'email_logs';

    protected $fillable = [
        'customer_id',
        'recipient',
        'subject',
        'provider_id',
        'status',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'customer_id' => 'integer'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
