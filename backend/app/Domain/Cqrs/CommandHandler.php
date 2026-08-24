<?php

namespace App\Domain\Cqrs;

interface CommandHandler
{
    public function handle(Command $command): mixed;
}
