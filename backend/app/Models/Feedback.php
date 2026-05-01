<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedback';
    protected $fillable = [
        'uuid', 'customer_id', 'feedback_type', 'rating', 'issue_type', 'message', 'platform', 'status'
    ];
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
