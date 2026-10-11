<?php

namespace Core\Services\Gateways;

/**
 * Paystack adapter skeleton. Requires PAYSTACK_SECRET_KEY.
 */
class PaystackGatewayDriver implements GatewayDriverInterface
{
    public function name(): string
    {
        return 'paystack';
    }

    private function secret(): string
    {
        $secret = (string) config('payments.paystack.secret');
        if ($secret === '') {
            throw new \RuntimeException('Paystack driver selected but payments.paystack.secret is empty.');
        }

        return $secret;
    }

    public function charge(array $data): array
    {
        $this->secret();

        $payload = [
            'email' => $data['email'] ?? null,
            'amount' => (int) round(((float) ($data['amount'] ?? 0)) * 100),
            'currency' => strtoupper((string) ($data['currency'] ?? \Core\Support\Currencies::default())),
            'reference' => $data['reference'] ?? bin2hex(random_bytes(8)),
        ];

        if (empty($payload['email'])) {
            throw new \RuntimeException('Paystack charge requires email.');
        }

        $ch = curl_init('https://api.paystack.co/transaction/initialize');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$this->secret(),
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 20,
        ]);
        $json = json_decode((string) curl_exec($ch), true) ?? [];
        curl_close($ch);

        if (empty($json['status'])) {
            throw new \RuntimeException($json['message'] ?? 'Paystack initialize failed.');
        }

        // Authorization URL returned; payment completes async via webhook.
        return [
            'transaction_id' => $payload['reference'],
            'status' => 'pending_manual',
            'provider' => 'paystack',
            'amount' => $payload['amount'] / 100,
            'currency' => $payload['currency'],
            'authorization_url' => $json['data']['authorization_url'] ?? null,
            'raw' => $json,
        ];
    }

    public function refund(array $payment, float $amount, array $context = []): array
    {
        $this->secret();
        $transactionId = $context['provider_payment_id'] ?? ($payment['provider_payment_id'] ?? null);
        if (!$transactionId) {
            throw new \RuntimeException('Paystack refund requires provider_payment_id.');
        }

        $ch = curl_init('https://api.paystack.co/refund');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$this->secret(),
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'transaction' => $transactionId,
                'amount' => (int) round($amount * 100),
            ]),
            CURLOPT_TIMEOUT => 20,
        ]);
        $json = json_decode((string) curl_exec($ch), true) ?? [];
        curl_close($ch);

        if (empty($json['status'])) {
            throw new \RuntimeException($json['message'] ?? 'Paystack refund failed.');
        }

        return [
            'refund_id' => (string) ($json['data']['id'] ?? $transactionId),
            'status' => 'pending_manual',
            'amount' => $amount,
            'provider' => 'paystack',
            'raw' => $json,
        ];
    }
}
