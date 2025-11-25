<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';
    protected $fillable = ['uuid', 'name', 'email', 'phone', 'password', 'status', 'reset_token', 'reset_token_expiry', 'created_at'];
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $hidden = ['password'];
}
