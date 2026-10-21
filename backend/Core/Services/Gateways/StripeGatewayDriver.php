<?php

namespace Core\Services\Gateways;

/**
 * Stripe adapter skeleton. Requires STRIPE_SECRET; throws until configured
 * so production never falls through to mock behaviour.
 */
class StripeGatewayDriver implements GatewayDriverInterface
{
    public function name(): string
    {
        return 'stripe';
    }

    private function secret(): string
    {
        $secret = (string) config('payments.stripe.secret');
        if ($secret === '') {
            throw new \RuntimeException('Stripe driver selected but payments.stripe.secret is empty.');
        }

        return $secret;
    }

    public function charge(array $data): array
    {
        $this->secret();

        $response = $this->request('POST', 'https://api.stripe.com/v1/payment_intents', [
            'amount' => (int) round(((float) ($data['amount'] ?? 0)) * 100),
            'currency' => strtolower((string) ($data['currency'] ?? \Core\Support\Currencies::default())),
            'description' => $data['description'] ?? ($data['reference'] ?? 'EverythingNeed charge'),
            'metadata[reference]' => $data['reference'] ?? '',
            'metadata[user_id]' => $data['user_id'] ?? '',
        ], $data['idempotency_key'] ?? null);

        $status = match ($response['status'] ?? '') {
            'succeeded' => 'completed',
            'processing', 'requires_action', 'requires_confirmation' => 'pending_manual',
            'canceled' => 'failed',
            default => 'failed',
        };

        if ($status === 'failed') {
            throw new \RuntimeException($response['error']['message'] ?? 'Stripe charge failed.');
        }

        return [
            'transaction_id' => $response['id'] ?? null,
            'status' => $status,
            'provider' => 'stripe',
            'amount' => $data['amount'] ?? 0,
            'currency' => $data['currency'] ?? \Core\Support\Currencies::default(),
            'raw' => $response,
        ];
    }

    public function refund(array $payment, float $amount, array $context = []): array
    {
        $this->secret();

        $response = $this->request('POST', 'https://api.stripe.com/v1/refunds', [
            'payment_intent' => $context['provider_payment_id'] ?? ($payment['provider_payment_id'] ?? null),
            'amount' => (int) round($amount * 100),
        ], $context['refund_id'] ?? null);

        if (($response['status'] ?? '') === 'failed') {
            throw new \RuntimeException('Stripe refund failed.');
        }

        return [
            'refund_id' => $response['id'] ?? null,
            'status' => ($response['status'] ?? '') === 'succeeded' ? 'completed' : 'pending_manual',
            'amount' => $amount,
            'provider' => 'stripe',
            'raw' => $response,
        ];
    }

    private function request(string $method, string $url, array $fields, ?string $idempotencyKey = null): array
    {
        $ch = curl_init($url);
        $headers = [
            'Authorization: Bearer '.$this->secret(),
            'Content-Type: application/x-www-form-urlencoded',
        ];

        // Stripe dedupes on this header: a retried charge with the same key
        // returns the original intent instead of taking the money twice.
        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $headers[] = 'Idempotency-Key: '.$idempotencyKey;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_POSTFIELDS => http_build_query($fields),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
        ]);
        $body = curl_exec($ch);
        $err = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false) {
            throw new \RuntimeException('Stripe request failed: '.$err);
        }

        $json = json_decode((string) $body, true) ?? [];

        if ($code >= 400) {
            $message = $json['error']['message'] ?? ('Stripe HTTP '.$code);
            throw new \RuntimeException($message);
        }

        return $json;
    }
}
