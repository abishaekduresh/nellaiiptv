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
        // Flussonic API v3 stats fields
        'inputs_bandwidth', 'out_bandwidth', 'online_clients',
        'video_width', 'video_height', 'video_codec', 'fps',
        'audio_codec', 'audio_bitrate', 'audio_sample_rate', 'audio_channels',
        'stream_status', 'published_via', 'published_from',
        'client_count', 'stream_url_type', 'max_sessions',
    ];

    protected $casts = [
        'output_formats'    => 'array',
        'viewer_limit'      => 'integer',
        'current_viewers'   => 'integer',
        'bitrate'           => 'integer',
        'server_id'         => 'integer',
        'inputs_bandwidth'  => 'integer',
        'out_bandwidth'     => 'integer',
        'online_clients'    => 'integer',
        'video_width'       => 'integer',
        'video_height'      => 'integer',
        'fps'               => 'float',
        'audio_bitrate'     => 'integer',
        'audio_sample_rate' => 'integer',
        'audio_channels'    => 'integer',
        'client_count'      => 'integer',
        'max_sessions'      => 'integer',
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
