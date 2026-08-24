<?php

namespace Modules\Messaging\Services;

use Modules\Messaging\Entities\Ticket;
use Modules\Messaging\Entities\TicketMessage;
use Core\Exceptions\NotFoundException;

class MessagingService
{
    public function createTicket(string $userId, array $data): Ticket
    {
        $ticket = Ticket::create([
            'user_id' => $userId,
            'ticket_number' => $this->generateTicketNumber(),
            'subject' => $data['subject'],
            'description' => $data['message'],
            'priority' => $data['priority'] ?? Ticket::PRIORITY_MEDIUM,
            'department_id' => $data['department_id'] ?? null,
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_id' => $userId,
            'message' => $data['message'],
            'is_internal' => false,
            'created_at' => now(),
        ]);

        return $ticket->fresh(['user', 'department']);
    }

    public function replyToTicket(string $ticketId, string $userId, array $data): TicketMessage
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        $message = TicketMessage::create([
            'ticket_id' => $ticketId,
            'sender_id' => $userId,
            'message' => $data['message'],
            'is_internal' => false,
            'created_at' => now(),
        ]);

        // Realtime side effect; notification creation happens in listener
        \Modules\Messaging\Events\TicketReplied::dispatch($message);

        return $message;
    }

    public function notifyUser(string $userId, string $title, string $message, string $type = 'general', ?string $relatedId = null): void
    {
        app(\Core\Services\NotificationService::class)
            ->notify($userId, $title, $message, $type, $relatedId);
    }

    public function getTicket(string $ticketId): ?Ticket
    {
        return Ticket::with(['user', 'department', 'messages.sender'])->find($ticketId);
    }

    public function getUserTickets(string $userId, int $page = 1, int $perPage = 15): object
    {
        return Ticket::with(['department'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function closeTicket(string $ticketId): void
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        $ticket->update(['status' => 'closed']);
    }

    private function generateTicketNumber(): string
    {
        return 'TKT-' . strtoupper(uniqid());
    }
}
