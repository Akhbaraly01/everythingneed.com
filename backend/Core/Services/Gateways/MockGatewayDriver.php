<?php

namespace Core\Services\Gateways;

class MockGatewayDriver implements GatewayDriverInterface
{
    public function name(): string
    {
        return 'mock';
    }

    public function charge(array $data): array
    {
        if (!config('payments.allow_mock_in_production')
            && !(in_array((string) config('app.env'), ['local', 'testing'], true)
                && app()->environment(['local', 'testing']))) {
            throw new \RuntimeException('Mock payment driver is disabled outside local/testing.');
        }

        return [
            'transaction_id' => 'txn_'.bin2hex(random_bytes(12)),
            'status' => 'completed',
            'provider' => 'mock',
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? \Core\Support\Currencies::default(),
        ];
    }

    public function refund(array $payment, float $amount, array $context = []): array
    {
        if (!config('payments.allow_mock_in_production')
            && !(in_array((string) config('app.env'), ['local', 'testing'], true)
                && app()->environment(['local', 'testing']))) {
            throw new \RuntimeException('Mock payment driver is disabled outside local/testing.');
        }

        return [
            'refund_id' => 'ref_'.bin2hex(random_bytes(12)),
            'status' => 'completed',
            'amount' => $amount,
            'provider' => 'mock',
        ];
    }
}
