<?php

namespace App\Domain\Exceptions;

class InsufficientFundsException extends DomainException
{
    public function __construct(float $required, float $available)
    {
        parent::__construct(
            "Insufficient funds: required {$required}, available {$available}",
            ['required' => $required, 'available' => $available],
            422
        );
    }
}
