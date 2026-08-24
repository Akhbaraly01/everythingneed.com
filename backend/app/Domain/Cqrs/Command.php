<?php

namespace App\Domain\Cqrs;

interface Command
{
    public function type(): string;
    public function payload(): array;
}
