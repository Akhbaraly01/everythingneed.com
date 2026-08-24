<?php

namespace App\Domain\Cqrs;

interface QueryHandler
{
    public function handle(Query $query): mixed;
}
