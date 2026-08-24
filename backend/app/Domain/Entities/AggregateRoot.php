<?php

namespace App\Domain\Entities;

use App\Domain\Events\DomainEvent;

abstract class AggregateRoot extends Entity
{
    private array $domainEvents = [];

    public function pullDomainEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }

    protected function recordEvent(DomainEvent $event): void
    {
        $this->domainEvents[] = $event;
    }

    public function domainEvents(): array
    {
        return $this->domainEvents;
    }
}
