<?php

namespace Core\Services\Gateways;

/**
 * PayPal adapter skeleton. Requires PAYPAL_CLIENT_ID/SECRET.
 */
class PayPalGatewayDriver implements GatewayDriverInterface
{
    public function name(): string
    {
        return 'paypal';
    }

    private function config(): array
    {
        $clientId = (string) config('payments.paypal.client_id');
        $secret = (string) config('payments.paypal.secret');
        if ($clientId === '' || $secret === '') {
            throw new \RuntimeException('PayPal driver selected but payments.paypal credentials are empty.');
        }

        return ['client_id' => $clientId, 'secret' => $secret];
    }

    private function baseUrl(): string
    {
        return config('payments.paypal.sandbox')
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
    }

    private function token(): string
    {
        $cfg = $this->config();
        $ch = curl_init($this->baseUrl().'/v1/oauth2/token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD => $cfg['client_id'].':'.$cfg['secret'],
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
            CURLOPT_TIMEOUT => 20,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
        $json = json_decode((string) $body, true) ?? [];
        if (empty($json['access_token'])) {
            throw new \RuntimeException('PayPal auth failed.');
        }

        return $json['access_token'];
    }

    public function charge(array $data): array
    {
        $token = $this->token();
        $amount = (float) ($data['amount'] ?? 0);
        $currency = strtoupper((string) ($data['currency'] ?? \Core\Support\Currencies::default()));

        $payload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => $currency,
                    'value' => number_format($amount, 2, '.', ''),
                ],
                'description' => $data['reference'] ?? 'EverythingNeed charge',
            ]],
        ];

        $ch = curl_init($this->baseUrl().'/v2/checkout/orders');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 20,
        ]);
        $body = curl_exec($ch);
        curl_close($ch);
        $json = json_decode((string) $body, true) ?? [];

        if (!isset($json['id'])) {
            throw new \RuntimeException('PayPal order creation failed.');
        }

        // Capture immediately (simplified); production should use webhooks for async status.
        $ch = curl_init($this->baseUrl().'/v2/checkout/orders/'.$json['id'].'/capture');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 20,
        ]);
        $capture = json_decode((string) curl_exec($ch), true) ?? [];
        curl_close($ch);

        $status = match ($capture['status'] ?? '') {
            'COMPLETED' => 'completed',
            'PAYER_ACTION_REQUIRED', 'CREATED', 'APPROVED' => 'pending_manual',
            default => 'failed',
        };

        if ($status === 'failed') {
            throw new \RuntimeException('PayPal capture failed.');
        }

        return [
            'transaction_id' => $json['id'],
            'status' => $status,
            'provider' => 'paypal',
            'amount' => $amount,
            'currency' => $currency,
            'raw' => $capture ?: $json,
        ];
    }

    public function refund(array $payment, float $amount, array $context = []): array
    {
        $token = $this->token();
        $saleId = $context['provider_payment_id'] ?? ($payment['provider_payment_id'] ?? null);
        if (!$saleId) {
            throw new \RuntimeException('PayPal refund requires provider_payment_id.');
        }

        $payload = [
            'amount' => [
                'value' => number_format($amount, 2, '.', ''),
                'currency_code' => strtoupper((string) ($payment['currency'] ?? \Core\Support\Currencies::default())),
            ],
        ];

        $ch = curl_init($this->baseUrl().'/v2/payments/captures/'.$saleId.'/refund');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer '.$token,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 20,
        ]);
        $json = json_decode((string) curl_exec($ch), true) ?? [];
        curl_close($ch);

        if (!isset($json['id'])) {
            throw new \RuntimeException('PayPal refund failed.');
        }

        return [
            'refund_id' => $json['id'],
            'status' => 'completed',
            'amount' => $amount,
            'provider' => 'paypal',
            'raw' => $json,
        ];
    }
}
