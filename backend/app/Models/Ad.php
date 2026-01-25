<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    protected $table = 'ads';
    protected $fillable = ['uuid', 'title', 'type', 'redirect_url', 'media_url', 'impressions', 'status', 'created_at'];
    public $timestamps = true;
    const UPDATED_AT = null;
}
