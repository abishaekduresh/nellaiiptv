<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChannelReport extends Model
{
    protected $table = 'channel_reports';
    protected $fillable = [
        'uuid', 'channel_id', 'customer_id', 'issue_type', 
        'description', 'status', 'created_at'
    ];
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
