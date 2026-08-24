<?php

namespace App\Domain\Events;

trait StoresDomainEvents
{
    private array $recordedEvents = [];

    protected function recordEvent(DomainEvent $event): void
    {
        $this->recordedEvents[] = $event;
    }

    public function pullEvents(): array
    {
        $events = $this->recordedEvents;
        $this->recordedEvents = [];
        return $events;
    }

    public function recordedEvents(): array
    {
        return $this->recordedEvents;
    }
}
