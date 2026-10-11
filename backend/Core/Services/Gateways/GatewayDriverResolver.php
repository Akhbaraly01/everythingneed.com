<?php

namespace Core\Services\Gateways;

class GatewayDriverResolver
{
    public function resolve(?string $driver = null): GatewayDriverInterface
    {
        $driver = strtolower($driver ?: (string) config('payments.driver', 'mock'));

        return match ($driver) {
            'manual' => new ManualGatewayDriver(),
            'stripe' => new StripeGatewayDriver(),
            'paypal' => new PayPalGatewayDriver(),
            'paystack' => new PaystackGatewayDriver(),
            'mock' => new MockGatewayDriver(),
            // A typo must fail loudly (spec 73) instead of silently routing
            // real money through the mock driver.
            default => throw new \InvalidArgumentException("Unknown payment driver [{$driver}]. Set PAYMENTS_DRIVER to a supported gateway."),
        };
    }
}
