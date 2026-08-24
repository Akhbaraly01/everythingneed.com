<?php

namespace App\Domain\ValueObjects;

class Money
{
    public function __construct(
        private readonly int $amount,
        private readonly string $currency = 'USD'
    ) {
        if ($this->amount < 0) {
            throw new \InvalidArgumentException('Money amount cannot be negative');
        }
    }

    public static function fromCents(int $cents, string $currency = 'USD'): self
    {
        return new self($cents, $currency);
    }

    public static function fromDecimal(float $amount, string $currency = 'USD'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public static function zero(string $currency = 'USD'): self
    {
        return new self(0, $currency);
    }

    public function amount(): int
    {
        return $this->amount;
    }

    public function decimal(): float
    {
        return $this->amount / 100;
    }

    public function currency(): string
    {
        return $this->currency;
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount - $other->amount, $this->currency);
    }

    public function multiply(int $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    public function isGreaterThanOrEqual(self $other): bool
    {
        $this->assertSameCurrency($other);
        return $this->amount >= $other->amount;
    }

    public function isZero(): bool
    {
        return $this->amount === 0;
    }

    public function equals(self $other): bool
    {
        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException(
                "Currency mismatch: {$this->currency} vs {$other->currency}"
            );
        }
    }

    public function toArray(): array
    {
        return ['amount' => $this->amount, 'currency' => $this->currency];
    }

    public function __toString(): string
    {
        return number_format($this->decimal(), 2, '.', '') . ' ' . $this->currency;
    }
}
