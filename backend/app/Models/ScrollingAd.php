<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrollingAd extends Model
{
    protected $table = 'scrolling_ads';
    
    protected $fillable = [
        'uuid', 
        'text_content', 
        'repeat_count',
        'scroll_speed',
        'status', 
        'created_at', 
        'updated_at'
    ];
    
    protected $hidden = ['id']; // Hide integer ID from API responses, exposing UUID instead
    
    public $timestamps = true;
}
