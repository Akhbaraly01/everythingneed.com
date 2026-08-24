<?php

namespace App\Domain\ValueObjects;

class Currency
{
    private const VALID_CODES = [
        'USD', 'EUR', 'GBP', 'BDT', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF',
        'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL', 'MXN', 'KRW',
    ];

    private function __construct(private readonly string $code) {}

    public static function from(string $code): self
    {
        $code = strtoupper(trim($code));
        if (!in_array($code, self::VALID_CODES, true)) {
            throw new \InvalidArgumentException("Invalid currency code: {$code}");
        }
        return new self($code);
    }

    public static function usd(): self { return new self('USD'); }
    public static function eur(): self { return new self('EUR'); }
    public static function bdt(): self { return new self('BDT'); }
    public static function gbp(): self { return new self('GBP'); }

    public function code(): string
    {
        return $this->code;
    }

    public function symbol(): string
    {
        return match ($this->code) {
            'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'BDT' => '৳',
            'INR' => '₹', 'JPY' => '¥', 'CNY' => '¥', 'CHF' => 'CHF',
            default => $this->code,
        };
    }

    public function decimals(): int
    {
        return in_array($this->code, ['JPY', 'KRW']) ? 0 : 2;
    }

    public function equals(self $other): bool
    {
        return $this->code === $other->code;
    }

    public function __toString(): string
    {
        return $this->code;
    }
}
