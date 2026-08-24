<?php

namespace App\Domain\Exceptions;

class ConflictException extends DomainException
{
    public function __construct(string $message)
    {
        parent::__construct($message, [], 409);
    }
}
