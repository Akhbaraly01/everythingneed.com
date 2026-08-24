<?php

namespace App\Domain\Exceptions;

class UnauthorizedException extends DomainException
{
    public function __construct(string $message = 'Authentication required.')
    {
        parent::__construct($message, [], 401);
    }
}
