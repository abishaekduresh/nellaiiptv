<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StreamClient extends Model
{
    protected $table = 'stream_clients';

    protected $fillable = [
        'uuid',
        'stream_id',
        'stream_name',
        'ip',
        'user_agent',
        'protocol',
        'opened_at',
        'closed_at',
        'country',
    ];

    protected $casts = [
        'stream_id'  => 'integer',
        'opened_at'  => 'integer',
        'closed_at'  => 'integer',
    ];

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class, 'stream_id');
    }
}
