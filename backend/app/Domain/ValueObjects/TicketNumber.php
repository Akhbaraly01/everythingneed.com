<?php

namespace App\Domain\ValueObjects;

class TicketNumber
{
    private function __construct(private readonly string $value) {}

    public static function generate(string $prefix = 'TK'): self
    {
        $number = $prefix . '-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        return new self($number);
    }

    public static function from(string $value): self
    {
        if (!preg_match('/^[A-Z]{2,5}-\d{8}-[A-Z0-9]{6}$/', $value)) {
            throw new \InvalidArgumentException("Invalid ticket number format: {$value}");
        }
        return new self($value);
    }

    public function value(): string { return $this->value; }
    public function __toString(): string { return $this->value; }
}
