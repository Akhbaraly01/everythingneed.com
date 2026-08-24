<?php

namespace App\Domain\Cqrs;

interface CommandBus
{
    public function dispatch(Command $command): mixed;
}
