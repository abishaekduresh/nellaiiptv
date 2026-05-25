<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisualAd extends Model
{
    protected $table    = 'visual_ads';
    protected $hidden   = ['id'];

    protected $fillable = [
        'uuid', 'title', 'description', 'ad_url', 'click_url', 'thumbnail_url',
        'is_skippable', 'skip_after_seconds', 'duration_seconds',
        'show_for_guests', 'show_for_free_users',
        'max_impressions_per_session', 'display_frequency', 'weight',
        'start_date', 'end_date', 'status',
        'total_impressions', 'total_skips', 'total_clicks',
    ];

    protected $casts = [
        'is_skippable'               => 'boolean',
        'show_for_guests'            => 'boolean',
        'show_for_free_users'        => 'boolean',
        'skip_after_seconds'         => 'integer',
        'duration_seconds'           => 'integer',
        'max_impressions_per_session'=> 'integer',
        'display_frequency'          => 'integer',
        'weight'                     => 'integer',
        'total_impressions'          => 'integer',
        'total_skips'                => 'integer',
        'total_clicks'               => 'integer',
    ];
}
