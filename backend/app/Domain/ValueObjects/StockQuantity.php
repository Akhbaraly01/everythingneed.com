<?php

namespace App\Domain\ValueObjects;

class StockQuantity
{
    public function __construct(private readonly int $value)
    {
        if ($value < 0) {
            throw new \InvalidArgumentException('Stock quantity cannot be negative');
        }
    }

    public static function from(int $value): self
    {
        return new self($value);
    }

    public function value(): int { return $this->value; }
    public function isAvailable(): bool { return $this->value > 0; }
    public function isDepleted(): bool { return $this->value === 0; }

    public function subtract(int $quantity): self
    {
        if ($quantity > $this->value) {
            throw new \DomainException("Insufficient stock: requested {$quantity}, available {$this->value}");
        }
        return new self($this->value - $quantity);
    }

    public function add(int $quantity): self
    {
        return new self($this->value + $quantity);
    }

    public function isSufficientFor(int $quantity): bool
    {
        return $this->value >= $quantity;
    }

    public function __toString(): string
    {
        return (string) $this->value;
    }
}
