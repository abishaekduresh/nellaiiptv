<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChannelRating extends Model
{
    protected $table = 'channel_ratings';
    protected $fillable = ['channel_id', 'customer_id', 'rating', 'updated_at'];
    public $timestamps = true;
    const CREATED_AT = null;
}
