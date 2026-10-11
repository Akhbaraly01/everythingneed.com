<?php

namespace Core\Services\Gateways;

class ManualGatewayDriver implements GatewayDriverInterface
{
    public function name(): string
    {
        return 'manual';
    }

    public function charge(array $data): array
    {
        return [
            'transaction_id' => 'MAN-'.bin2hex(random_bytes(8)),
            'status' => 'pending_manual',
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? \Core\Support\Currencies::default(),
            'instructions' => 'Awaiting off-platform payment confirmation by finance.',
        ];
    }

    public function refund(array $payment, float $amount, array $context = []): array
    {
        return [
            'refund_id' => 'MANREF-'.bin2hex(random_bytes(8)),
            'status' => 'pending_manual',
            'amount' => $amount,
            'instructions' => 'Finance must confirm the off-platform refund.',
        ];
    }
}
