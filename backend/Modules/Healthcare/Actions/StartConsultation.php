<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\HealthTicket;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class StartConsultation
{
    public function execute(string $ticketId): void
    {
        $ticket = HealthTicket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('HealthTicket', $ticketId);
        }

        if ($ticket->status !== 'assigned') {
            throw new ValidationException('Can only start an assigned appointment');
        }

        if (!$ticket->doctor_id) {
            throw new ValidationException('No doctor assigned to this appointment');
        }

        $ticket->update(['status' => 'in_consultation']);
    }
}
