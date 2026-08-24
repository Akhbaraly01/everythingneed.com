<?php

namespace Core\Services\Contracts;

interface CurrencyServiceInterface
{
    public function convert(float $amount, string $from, string $to): float;
    public function getRate(string $from, string $to): float;
    public function format(float $amount, string $currency): string;
}
