<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChannelView extends Model
{
    protected $table = 'channel_views';
    protected $fillable = ['channel_id', 'view_date', 'client_ip', 'count'];
    public $timestamps = true;

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }
}
