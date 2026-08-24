<?php

namespace App\Domain\Cqrs;

interface Query
{
    public function type(): string;
    public function payload(): array;
}
