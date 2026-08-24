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

        $ticket->update([
            'doctor_id' => $doctorId,
            'status' => 'assigned',
        ]);
    }
}
