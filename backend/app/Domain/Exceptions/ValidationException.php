<?php

namespace App\Domain\Exceptions;

class ValidationException extends DomainException
{
    public function __construct(string $message, array $errors = [])
    {
        parent::__construct($message, ['errors' => $errors], 422);
    }

    public function errors(): array
    {
        return $this->metadata['errors'] ?? [];
    }
}
