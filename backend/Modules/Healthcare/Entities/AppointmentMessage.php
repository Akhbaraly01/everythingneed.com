<?php

namespace Modules\Healthcare\Entities;

use App\Models\Model;

/**
 * L-H-3: a single message on an appointment's discussion thread. Visible to
 * the patient, the assigned doctor and healthcare admins.
 */
class AppointmentMessage extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'body',
    ];

    public function ticket()
    {
        return $this->belongsTo(HealthTicket::class, 'ticket_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
