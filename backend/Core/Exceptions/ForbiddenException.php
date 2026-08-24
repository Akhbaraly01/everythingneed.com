<?php

namespace Core\Exceptions;

class ForbiddenException extends DomainException
{
    protected int $statusCode = 403;

    public function __construct(string $message = 'Forbidden')
    {
        parent::__construct($message, 'FORBIDDEN');
    }
}
