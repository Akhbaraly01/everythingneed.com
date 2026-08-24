<?php

namespace Core\Exceptions;

class UnauthorizedException extends DomainException
{
    protected int $statusCode = 401;

    public function __construct(string $message = 'Unauthorized')
    {
        parent::__construct($message, 'UNAUTHORIZED');
    }
}
