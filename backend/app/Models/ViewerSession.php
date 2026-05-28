<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViewerSession extends Model
{
    protected $table = 'viewer_sessions';
    public $timestamps = false;

    protected $fillable = [
        'session_id', 'stream_id', 'ip_address', 'country',
        'user_agent', 'started_at', 'bandwidth', 'protocol',
    ];

    protected $casts = [
        'bandwidth' => 'integer',
        'stream_id' => 'integer',
    ];

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class, 'stream_id');
    }
}
