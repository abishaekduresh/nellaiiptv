<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Channel extends Model
{
    protected $table = 'channels';
    protected $fillable = [
        'uuid', 'name', 'channel_number', 'hls_url', 'village', 
        'category_id', 'state_id', 'language_id', 'district_id', 'thumbnail_path', 'logo_path',
        'is_featured', 'expiry_at', 'status', 'created_at', 'is_premium', 'allowed_platforms'
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_premium' => 'boolean',
        'is_ad_enabled' => 'boolean',
    ];
    
    protected $hidden = ['thumbnail_path', 'logo_path'];
    protected $appends = ['thumbnail_url', 'logo_url', 'viewers_count_formatted', 'average_rating'];

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

    public function getThumbnailUrlAttribute()
    {
        return $this->formatUrl($this->attributes['thumbnail_path'] ?? null);
    }

    public function getLogoUrlAttribute()
    {
        return $this->formatUrl($this->attributes['logo_path'] ?? null);
    }

    public function getAverageRatingAttribute()
    {
        return $this->attributes['average_rating'] ?? 0;
    }

    public function getViewersCountFormattedAttribute()
    {
        return $this->attributes['viewers_count_formatted'] ?? '';
    }

    private function formatUrl($value)
    {
        if (empty($value)) return $value;
        if (strpos($value, 'http') === 0) return $value;
        
        // Robust Env Fetch
        $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL') ?? $_SERVER['APP_URL'] ?? null;
        
        if (!empty($appUrl)) {
            return rtrim($appUrl, '/') . $value;
        }
        
        // Dynamic fallback
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        return "$protocol://$host" . $value;
    }
}
