<?php

namespace Core\Exceptions;

class ConflictException extends DomainException
{
    protected int $statusCode = 409;

    public function __construct(string $message = 'Conflict')
    {
        parent::__construct($message, 'CONFLICT');
    }
}
