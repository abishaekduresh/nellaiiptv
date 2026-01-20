<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    protected $table = 'api_keys';

    protected $fillable = [
        'uuid',
        'key_string',
        'title',
        'description',
        'status',
        'allowed_platforms',
        'expires_at',
        'last_used_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];
}
