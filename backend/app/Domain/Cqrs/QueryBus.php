<?php

namespace App\Domain\Cqrs;

interface QueryBus
{
    public function ask(Query $query): mixed;
}
