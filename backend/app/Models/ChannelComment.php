<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChannelComment extends Model
{
    protected $table = 'channel_comments';
    protected $fillable = ['uuid', 'channel_id', 'customer_id', 'comment', 'status', 'created_at'];
    public $timestamps = true;
    const UPDATED_AT = null;

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }
}
