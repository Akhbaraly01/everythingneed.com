<?php

namespace App\Domain\ValueObjects;

class Percentage
{
    public function __construct(private readonly float $value)
    {
        if ($value < 0 || $value > 100) {
            throw new \InvalidArgumentException("Percentage must be between 0 and 100: {$value}");
        }
    }

    public static function from(float $value): self
    {
        return new self($value);
    }

    public static function fromFraction(float $fraction): self
    {
        return new self(round($fraction * 100, 2));
    }

    public function value(): float { return $this->value; }
    public function fraction(): float { return $this->value / 100; }

    public function apply(float $amount): float
    {
        return round($amount * $this->fraction(), 2);
    }

    public function __toString(): string
    {
        return "{$this->value}%";
    }
}
