<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Channel extends Model
{
    protected $table = 'channels';
    protected $fillable = [
        'uuid', 'name', 'channel_number', 'hls_url', 'village', 
        'category_id', 'state_id', 'language_id', 'district_id', 'thumbnail_url', 
        'is_featured', 'expiry_at', 'status', 'created_at'
    ];
    public $timestamps = true;
    const UPDATED_AT = null;

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function district()
    {
        return $this->belongsTo(District::class);
    }

    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function ratings()
    {
        return $this->hasMany(ChannelRating::class);
    }

    public function comments()
    {
        return $this->hasMany(ChannelComment::class);
    }

    public function views()
    {
        return $this->hasMany(ChannelView::class);
    }
}
