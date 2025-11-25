<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveViewer extends Model
{
    protected $table = 'live_viewers';
    protected $fillable = ['channel_id', 'device_uuid', 'last_heartbeat'];
    public $timestamps = false;
    protected $dates = ['last_heartbeat'];
}
