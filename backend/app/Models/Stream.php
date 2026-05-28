<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stream extends Model
{
    protected $table = 'streams';

    protected $fillable = [
        'uuid', 'server_id', 'stream_name', 'input_url', 'output_formats',
        'stream_key', 'health_status', 'viewer_limit', 'current_viewers',
        'bitrate', 'status',
    ];

    protected $casts = [
        'output_formats'  => 'array',
        'viewer_limit'    => 'integer',
        'current_viewers' => 'integer',
        'bitrate'         => 'integer',
        'server_id'       => 'integer',
    ];

    public $timestamps = true;

    public function server(): BelongsTo
    {
        return $this->belongsTo(StreamServer::class, 'server_id');
    }

    public function viewerSessions(): HasMany
    {
        return $this->hasMany(ViewerSession::class, 'stream_id');
    }
}
