<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'category';
    protected $fillable = ['uuid', 'name', 'status', 'order_number'];
    public $timestamps = false;
}
