<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerMonitoring extends Model
{
    protected $table = 'server_monitoring';
    public $timestamps = false;

    protected $fillable = [
        'uuid', 'server_id', 'cpu_usage', 'ram_usage', 'disk_usage',
        'network_in', 'network_out', 'active_streams', 'active_viewers', 'recorded_at',
    ];

    protected $casts = [
        'cpu_usage'      => 'float',
        'ram_usage'      => 'float',
        'disk_usage'     => 'float',
        'network_in'     => 'integer',
        'network_out'    => 'integer',
        'active_streams' => 'integer',
        'active_viewers' => 'integer',
        'server_id'      => 'integer',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(StreamServer::class, 'server_id');
    }
}
