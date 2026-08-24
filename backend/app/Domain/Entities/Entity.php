<?php

namespace App\Domain\Entities;

use App\Domain\ValueObjects\UniqueId;

abstract class Entity
{
    protected UniqueId $id;

    public function __construct(UniqueId $id)
    {
        $this->id = $id;
    }

    public function id(): UniqueId
    {
        return $this->id;
    }

    public function equals(self $other): bool
    {
        return $this->id->equals($other->id());
    }

    abstract public function toArray(): array;
}
