<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChannelOnboarding extends Model
{
    protected $table = 'channel_onboarding';
    protected $fillable = [
        'uuid', 'channel_name', 'logo_url', 'category', 'language',
        'stream_url', 'website_url', 'contact_name', 'contact_email',
        'contact_phone', 'description', 'status', 'admin_notes',
    ];
    public $timestamps = false;
    const CREATED_AT = 'created_at';
}
