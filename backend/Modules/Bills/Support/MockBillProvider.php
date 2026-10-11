<?php

namespace Modules\Bills\Support;

/**
 * Deterministic in-process provider (DEV/TEST ONLY). Mirrors the payment
 * mock driver guardrails: it refuses to run outside explicit development
 * or testing contexts.
 */
class MockBillProvider implements BillProviderInterface
{
    public function name(): string
    {
        return 'mock';
    }

    public function vend(array $order): array
    {
        if (!config('bills.allow_mock_in_production')
            && !(in_array((string) config('app.env'), ['local', 'testing'], true)
                && app()->environment(['local', 'testing']))) {
            throw new \RuntimeException('Mock bill provider is disabled outside local/testing.');
        }

        if (config('bills.mock_fail')) {
            throw new \RuntimeException('Mock bill provider forced failure (tests).');
        }

        return [
            'provider_reference' => 'BILL-txn_'.bin2hex(random_bytes(12)),
            'status' => 'succeeded',
            'raw' => ['service' => $order['service'] ?? null],
        ];
    }
}
