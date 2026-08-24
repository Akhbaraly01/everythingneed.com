<?php

namespace App\Domain\Exceptions;

use RuntimeException;

class DomainException extends RuntimeException
{
    public function __construct(string $message = '', protected array $metadata = [], int $code = 0)
    {
        parent::__construct($message, $code);
    }

    public function metadata(): array
    {
        return $this->metadata;
    }

    public function toArray(): array
    {
        return [
            'message' => $this->getMessage(),
            'code' => $this->getCode(),
            'metadata' => $this->metadata,
        ];
    }
}
