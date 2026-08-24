<?php

namespace Core\Exceptions;

class NotFoundException extends DomainException
{
    protected int $statusCode = 404;

    public function __construct(string $message = 'Not Found')
    {
        parent::__construct($message, 'NOT_FOUND');
    }
}
