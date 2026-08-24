<?php

namespace Core\Exceptions;

class InsufficientFundsException extends DomainException
{
    protected int $statusCode = 422;

    public function __construct(float $required, float $available)
    {
        parent::__construct(
            "Insufficient funds: required {$required}, available {$available}",
            'INSUFFICIENT_FUNDS'
        );
    }
}
