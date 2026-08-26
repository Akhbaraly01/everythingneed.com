<?php

namespace Modules\Orders\Entities;

use App\Models\Model;

class Dispute extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'subject',
        'description',
        'status',
        'resolution',
        'assigned_to',
        'resolution_notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(\App\Models\User::class, 'assigned_to');
    }
}
