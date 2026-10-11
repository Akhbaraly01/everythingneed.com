<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\HealthTicket;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class AssignDoctor
{
    public function execute(string $ticketId, string $doctorId): void
    {
        $ticket = HealthTicket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('HealthTicket', $ticketId);
        }

        if ($ticket->status !== 'pending') {
            throw new ValidationException('Can only assign doctor to pending tickets');
        }

        $doctor = \Modules\Healthcare\Entities\Doctor::find($doctorId);
        if (!$doctor) {
            throw new NotFoundException('Doctor', $doctorId);
        }
        if (!$doctor->is_available) {
            throw new ValidationException('Doctor is not available');
        }

        $ticket->update([
            'doctor_id' => $doctorId,
            'status' => 'assigned',
        ]);

        event(new \Modules\Healthcare\Events\DoctorAssigned($ticket->fresh('doctor')));
    }
}
