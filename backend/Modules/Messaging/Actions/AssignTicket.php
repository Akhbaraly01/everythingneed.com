<?php

namespace Modules\Messaging\Actions;

use Modules\Messaging\Entities\Ticket;
use App\Models\User;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class AssignTicket
{
    public function execute(string $ticketId, string $assigneeId): object
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        $assignee = User::find($assigneeId);

        if (!$assignee) {
            throw new NotFoundException('User', $assigneeId);
        }

        $ticket->update([
            'assigned_to' => $assigneeId,
            'status' => Ticket::STATUS_IN_PROGRESS,
        ]);

        return $ticket->fresh(['assignee']);
    }
}
