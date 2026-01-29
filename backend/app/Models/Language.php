<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $table = 'languages';
    protected $fillable = ['uuid', 'name', 'code', 'order_number'];
    public $timestamps = false;
}
