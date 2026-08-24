<?php

namespace Core\Events;

use App\Domain\Events\DomainEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BaseEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $eventName,
        public readonly array $payload,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('domain-events');
    }

    public function broadcastAs(): string
    {
        return $this->eventName;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
