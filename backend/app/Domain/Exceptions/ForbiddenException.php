<?php

namespace App\Domain\Exceptions;

class ForbiddenException extends DomainException
{
    public function __construct(string $message = 'You do not have permission to perform this action.')
    {
        parent::__construct($message, [], 403);
    }
}
