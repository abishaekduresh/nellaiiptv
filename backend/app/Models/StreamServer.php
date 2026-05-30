<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StreamServer extends Model
{
    protected $table = 'stream_servers';

    protected $fillable = [
        'uuid',
        'server_name',
        'server_host_ip',
        'server_host_domain',
        'api_port',
        'api_version',
        'protocol',
        'username',
        'password_encrypted',
        'bearer_token',
        'timezone',
        'region',
        'health_status',
        'last_ping_at',
        'status',
    ];

    protected $casts = [
        'api_port' => 'integer',
    ];

    protected $hidden = ['password_encrypted', 'bearer_token'];

    public $timestamps = true;
}
