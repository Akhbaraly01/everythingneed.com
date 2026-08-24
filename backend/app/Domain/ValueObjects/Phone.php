<?php

namespace App\Domain\ValueObjects;

class Phone
{
    private function __construct(private readonly string $value) {}

    public static function from(string $value): self
    {
        $cleaned = preg_replace('/[^\d+]/', '', $value);
        if (!preg_match('/^\+?[1-9]\d{6,14}$/', $cleaned)) {
            throw new \InvalidArgumentException("Invalid phone number: {$value}");
        }
        return new self($cleaned);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function formatted(): string
    {
        $digits = ltrim($this->value, '+');
        if (strlen($digits) > 10) {
            $country = substr($digits, 0, strlen($digits) - 10);
            $number = substr($digits, -10);
            return "+{$country} " . chunk_split($number, 3, ' ');
        }
        return $this->value;
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
