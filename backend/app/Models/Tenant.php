<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $table = 'tenants';

    protected $fillable = [
        'uuid', 'company_name', 'email', 'max_viewers',
        'allowed_servers', 'channel_id', 'status',
    ];

    protected $casts = [
        'allowed_servers' => 'array',
        'channel_id'      => 'array',
        'max_viewers'     => 'integer',
    ];

    public $timestamps = true;
}
