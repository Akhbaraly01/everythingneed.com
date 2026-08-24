<?php

namespace Modules\Messaging\Actions;

use Modules\Messaging\Entities\Ticket;
use Modules\Messaging\Entities\TicketMessage;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class ReplyToTicket
{
    public function execute(string $ticketId, string $senderId, array $data): object
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        if (in_array($ticket->status, [Ticket::STATUS_RESOLVED, Ticket::STATUS_CLOSED])) {
            throw new ValidationException('Cannot reply to a resolved or closed ticket');
        }

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_id' => $senderId,
            'message' => $data['message'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        if ($ticket->status === Ticket::STATUS_OPEN) {
            $ticket->update(['status' => Ticket::STATUS_IN_PROGRESS]);
        }

        return $message->fresh(['sender']);
    }
}
