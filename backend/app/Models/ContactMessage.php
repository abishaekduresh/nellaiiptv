<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $table = 'contact_messages';
    protected $fillable = [
        'uuid', 'name', 'email', 'subject', 'message', 'status', 'created_at'
    ];
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;
}
