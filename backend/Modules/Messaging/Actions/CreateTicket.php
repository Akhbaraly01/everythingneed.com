<?php

namespace Modules\Messaging\Actions;

use Modules\Messaging\Entities\Ticket;
use Illuminate\Support\Str;

class CreateTicket
{
    public function execute(array $data): object
    {
        $ticket = Ticket::create([
            'user_id' => $data['user_id'],
            'ticket_number' => $this->generateTicketNumber(),
            'subject' => $data['subject'],
            'description' => $data['description'] ?? null,
            'priority' => $data['priority'] ?? Ticket::PRIORITY_MEDIUM,
            'department_id' => $data['department_id'] ?? null,
            'status' => Ticket::STATUS_OPEN,
        ]);

        return $ticket->fresh();
    }

    private function generateTicketNumber(): string
    {
        return 'TK-' . strtoupper(Str::random(8));
    }
}
