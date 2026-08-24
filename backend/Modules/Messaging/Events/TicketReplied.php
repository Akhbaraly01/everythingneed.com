<?php

namespace Modules\Messaging\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Messaging\Entities\TicketMessage;

class TicketReplied implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public TicketMessage $message
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('ticket.'.$this->message->ticket_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ticket.replied';
    }

    public function broadcastWith(): array
    {
        $createdAt = $this->message->created_at;

        return [
            'id' => $this->message->id,
            'ticket_id' => $this->message->ticket_id,
            'sender_id' => $this->message->sender_id,
            'message' => $this->message->message,
            'created_at' => $createdAt instanceof \DateTimeInterface
                ? $createdAt->toIso8601String()
                : $createdAt,
        ];
    }
}
