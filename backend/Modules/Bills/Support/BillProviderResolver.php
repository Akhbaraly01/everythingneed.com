<?php

namespace Modules\Bills\Support;

class BillProviderResolver
{
    public function resolve(?string $provider = null): BillProviderInterface
    {
        $provider = strtolower($provider ?: (string) config('bills.driver', 'mock'));

        return match ($provider) {
            'mock' => new MockBillProvider(),
            'manual' => new ManualBillProvider(),
            // A typo must fail loudly (spec 30) instead of silently routing
            // real money through the mock provider.
            default => throw new \InvalidArgumentException("Unknown bill provider [{$provider}]. Set BILLS_DRIVER to a supported provider."),
        };
    }
}
