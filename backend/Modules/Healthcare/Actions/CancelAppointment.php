<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\HealthTicket;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class CancelAppointment
{
    public function execute(string $ticketId, ?string $reason = null): void
    {
        $ticket = HealthTicket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('HealthTicket', $ticketId);
        }

        if (in_array($ticket->status, ['completed', 'cancelled'])) {
            throw new ValidationException('Cannot cancel appointment in current status');
        }

        $ticket->update(['status' => 'cancelled']);
    }
}
