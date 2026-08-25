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
            'is_internal' => (bool) ($data['is_internal'] ?? false),
            'created_at' => now(),
        ]);

        // Internal notes are agent-side activity; they don't bump the ticket
        // into "replied" for the customer nor fire the customer notification.
        if (!$message->is_internal) {
            \Modules\Messaging\Events\TicketReplied::dispatch($message);
        }

        return $message;
    }

    /**
     * Append an entry to the ticket's immutable audit trail.
     */
    public function recordEvent(string $ticketId, ?string $actorId, string $type, array $payload = []): void
    {
        \Modules\Messaging\Entities\TicketEvent::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'ticket_id' => $ticketId,
            'actor_id' => $actorId,
            'event_type' => $type,
            'payload' => $payload ?: null,
            'created_at' => now(),
        ]);
    }

    /**
     * Escalate: raise priority to urgent and mark the escalation timestamp.
     */
    public function escalate(string $ticketId, string $actorId, ?string $reason = null): Ticket
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        if ($ticket->escalated_at) {
            throw new \Core\Exceptions\ValidationException('Ticket has already been escalated.');
        }

        if (in_array($ticket->status, [Ticket::STATUS_RESOLVED, Ticket::STATUS_CLOSED], true)) {
            throw new \Core\Exceptions\ValidationException('Resolved or closed tickets cannot be escalated.');
        }

        $ticket->update([
            'priority' => Ticket::PRIORITY_URGENT,
            'escalated_at' => now(),
        ]);

        $this->recordEvent($ticketId, $actorId, \Modules\Messaging\Entities\TicketEvent::ESCALATED, [
            'reason' => $reason,
        ]);

        return $ticket->fresh();
    }

    /**
     * Post-resolution satisfaction rating — ticket owner only.
     */
    public function rateSatisfaction(string $ticketId, string $userId, int $rating, ?string $comment = null): Ticket
    {
        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            throw new NotFoundException('Ticket', $ticketId);
        }

        if ((string) $ticket->user_id !== (string) $userId) {
            throw new \Core\Exceptions\ForbiddenException('Only the ticket owner can rate it.');
        }

        if (!in_array($ticket->status, [Ticket::STATUS_RESOLVED, Ticket::STATUS_CLOSED], true)) {
            throw new \Core\Exceptions\ValidationException('Satisfaction can only be rated after resolution.');
        }

        if ($ticket->satisfaction_rating) {
            throw new \Core\Exceptions\ConflictException('This ticket has already been rated.');
        }

        $ticket->update([
            'satisfaction_rating' => $rating,
            'satisfaction_comment' => $comment,
        ]);

        $this->recordEvent($ticketId, $userId, \Modules\Messaging\Entities\TicketEvent::RATED, [
            'rating' => $rating,
        ]);

        return $ticket->fresh();
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
