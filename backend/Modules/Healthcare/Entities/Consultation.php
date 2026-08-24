<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

class Consultation extends Model
{
    protected $fillable = [
        'ticket_id',
        'diagnosis',
        'notes',
        'prescription_items',
        'follow_up_date',
        'created_by',
    ];

    protected $casts = [
        'prescription_items' => 'array',
        'follow_up_date' => 'date',
    ];

    public function ticket()
    {
        return $this->belongsTo(HealthTicket::class, 'ticket_id');
    }
}
