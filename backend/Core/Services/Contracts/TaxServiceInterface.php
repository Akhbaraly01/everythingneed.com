<?php

namespace Core\Services\Contracts;

interface TaxServiceInterface
{
    public function calculate(float $amount, string $jurisdiction = 'default'): array;
    public function getRate(string $jurisdiction = 'default'): float;
}
