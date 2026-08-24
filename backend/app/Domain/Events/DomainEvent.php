<?php

namespace App\Domain\Events;

use Carbon\Carbon;

class DomainEvent
{
    public function __construct(
        public readonly string $eventName,
        public readonly array $payload,
        public readonly string $eventId,
        public readonly Carbon $occurredAt,
        public readonly array $metadata = [],
    ) {
        $this->eventId ??= uniqid('evt_', true);
        $this->occurredAt ??= Carbon::now();
    }

    public static function eventName(): string
    {
        return class_basename(static::class);
    }

    public function toArray(): array
    {
        return [
            'event' => $this->eventName,
            'payload' => $this->payload,
            'event_id' => $this->eventId,
            'occurred_at' => $this->occurredAt->toIso8601String(),
            'metadata' => $this->metadata,
        ];
    }
}
