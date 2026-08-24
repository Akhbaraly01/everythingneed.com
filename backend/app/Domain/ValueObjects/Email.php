<?php

namespace App\Domain\ValueObjects;

class Email
{
    private function __construct(private readonly string $value) {}

    public static function from(string $value): self
    {
        $value = strtolower(trim($value));
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email address: {$value}");
        }
        return new self($value);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function domain(): string
    {
        return substr($this->value, strpos($this->value, '@') + 1);
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
