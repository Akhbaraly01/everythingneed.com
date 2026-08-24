<?php

namespace App\Domain\Shared\ValueObjects;

use App\Domain\Shared\Exceptions\InvalidMoneyException;

class Money
{
    private int $amount;
    private string $currency;

    public function __construct(int $amount, string $currency = 'USD')
    {
        if ($amount < 0) {
            throw new InvalidMoneyException('Amount cannot be negative');
        }
        if (strlen($currency) !== 3) {
            throw new InvalidMoneyException('Invalid currency code');
        }
        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public static function fromDecimal(float $amount, string $currency = 'USD'): self
    {
        return new self((int) ($amount * 100), $currency);
    }

    public function amount(): int
    {
        return $this->amount;
    }

    public function currency(): string
    {
        return $this->currency;
    }

    public function toDecimal(): float
    {
        return $this->amount / 100;
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency()) {
            throw new InvalidMoneyException('Cannot add different currencies');
        }
        return new self($this->amount + $other->amount(), $this->currency);
    }

    public function subtract(Money $other): self
    {
        if ($this->currency !== $other->currency()) {
            throw new InvalidMoneyException('Cannot subtract different currencies');
        }
        return new self($this->amount - $other->amount(), $this->currency);
    }

    public function multiply(int $multiplier): self
    {
        return new self($this->amount * $multiplier, $this->currency);
    }

    public function equals(Money $other): bool
    {
        return $this->amount === $other->amount() && $this->currency === $other->currency();
    }

    public function greaterThan(Money $other): bool
    {
        if ($this->currency !== $other->currency()) {
            throw new InvalidMoneyException('Cannot compare different currencies');
        }
        return $this->amount > $other->amount();
    }

    public function lessThan(Money $other): bool
    {
        if ($this->currency !== $other->currency()) {
            throw new InvalidMoneyException('Cannot compare different currencies');
        }
        return $this->amount < $other->amount();
    }

    public function toArray(): array
    {
        return [
            'amount' => $this->amount,
            'currency' => $this->currency,
        ];
    }

    public function __toString(): string
    {
        return sprintf('%s %s', $this->currency, number_format($this->toDecimal(), 2));
    }
}
