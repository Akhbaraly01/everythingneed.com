<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Entities\Payment;

class PaymentWebhookController extends Controller
{
    public function stripe(Request $request): JsonResponse
    {
        if (!$this->verifyStripeSignature($request)) {
            return response()->json(['status' => 'invalid_signature'], 400);
        }

        return $this->handle('stripe', $request, function (array $payload): array {
            $type = (string) ($payload['type'] ?? '');
            $intentId = $payload['data']['object']['id'] ?? null;
            if (!$intentId) {
                return ['status' => 'processed'];
            }

            $payment = Payment::where('provider_payment_id', $intentId)
                ->orWhere('reference', $intentId)
                ->first();
            if (!$payment) {
                return ['status' => 'processed'];
            }

            return match ($type) {
                'payment_intent.succeeded' => $this->transition($payment, Payment::STATUS_SUCCEEDED),
                'payment_intent.payment_failed' => $this->transition($payment, Payment::STATUS_FAILED),
                'payment_intent.canceled' => $this->transition($payment, Payment::STATUS_CANCELLED),
                default => ['status' => 'processed'],
            };
        });
    }

    public function paypal(Request $request): JsonResponse
    {
        if (!$this->verifyPaypalSignature($request)) {
            return response()->json(['status' => 'invalid_signature'], 400);
        }

        return $this->handle('paypal', $request, function (array $payload): array {
            $eventType = (string) ($payload['event_type'] ?? '');
            $resourceId = $payload['resource']['id'] ?? null;
            if (!$resourceId) {
                return ['status' => 'processed'];
            }

            $payment = Payment::where('provider_payment_id', $resourceId)
                ->orWhere('reference', $resourceId)
                ->first();
            if (!$payment) {
                return ['status' => 'processed'];
            }

            if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                return $this->transition($payment, Payment::STATUS_SUCCEEDED);
            }
            if (str_ends_with($eventType, '.DENIED') || str_ends_with($eventType, '.FAILED')) {
                return $this->transition($payment, Payment::STATUS_FAILED);
            }
            if (str_ends_with($eventType, '.CANCELLED')) {
                return $this->transition($payment, Payment::STATUS_CANCELLED);
            }

            return ['status' => 'processed'];
        });
    }

    public function paystack(Request $request): JsonResponse
    {
        if (!$this->verifyPaystackSignature($request)) {
            return response()->json(['status' => 'invalid_signature'], 400);
        }

        return $this->handle('paystack', $request, function (array $payload): array {
            $event = (string) ($payload['event'] ?? '');
            $reference = $payload['data']['reference'] ?? null;
            if (!$reference) {
                return ['status' => 'processed'];
            }

            $payment = Payment::where('reference', $reference)
                ->orWhere('provider_payment_id', $reference)
                ->first();
            if (!$payment) {
                return ['status' => 'processed'];
            }

            if ($event === 'charge.success') {
                return $this->transition($payment, Payment::STATUS_SUCCEEDED, [
                    'provider_payment_id' => $payload['data']['id'] ?? $payment->provider_payment_id,
                ]);
            }
            if ($event === 'charge.failed') {
                return $this->transition($payment, Payment::STATUS_FAILED);
            }

            return ['status' => 'processed'];
        });
    }

    private function verifyStripeSignature(Request $request): bool
    {
        $secret = (string) config('payments.stripe.webhook_secret', '');
        if ($secret === '') {
            // Production must configure STRIPE_WEBHOOK_SECRET; local/testing may omit for mock flows.
            return app()->environment(['local', 'testing']);
        }

        $header = (string) $request->header('Stripe-Signature', '');
        if ($header === '') {
            return false;
        }

        $timestamp = null;
        $signatures = [];
        foreach (explode(',', $header) as $pair) {
            [$k, $v] = array_pad(explode('=', trim($pair), 2), 2, null);
            if ($k === 't') {
                $timestamp = (int) $v;
            } elseif ($k === 'v1' && $v !== null) {
                $signatures[] = $v;
            }
        }

        if ($timestamp <= 0 || $signatures === []) {
            return false;
        }

        // Reject events older than 5 minutes to limit replay.
        if (abs(time() - $timestamp) > 300) {
            return false;
        }

        $payload = $request->getContent();
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        foreach ($signatures as $sig) {
            if (hash_equals($expected, $sig)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Paystack: x-paystack-signature = HMAC-SHA512(raw body, secret).
     */
    private function verifyPaystackSignature(Request $request): bool
    {
        $secret = (string) config('payments.paystack.secret', '');
        if ($secret === '') {
            return app()->environment(['local', 'testing']);
        }

        $header = (string) $request->header('x-paystack-signature', '');
        if ($header === '') {
            return false;
        }

        $expected = hash_hmac('sha512', $request->getContent(), $secret);

        return hash_equals($expected, $header);
    }

    /**
     * PayPal: verify transmission when PAYPAL_WEBHOOK_ID is configured
     * (uses verify-webhook-signature API). Local/testing may omit.
     */
    private function verifyPaypalSignature(Request $request): bool
    {
        $webhookId = (string) config('payments.paypal.webhook_id', '');
        if ($webhookId === '') {
            return app()->environment(['local', 'testing']);
        }

        $headers = [
            'paypal-auth-algo' => (string) $request->header('PAYPAL-AUTH-ALGO', ''),
            'paypal-cert-url' => (string) $request->header('PAYPAL-CERT-URL', ''),
            'paypal-transmission-id' => (string) $request->header('PAYPAL-TRANSMISSION-ID', ''),
            'paypal-transmission-sig' => (string) $request->header('PAYPAL-TRANSMISSION-SIG', ''),
            'paypal-transmission-time' => (string) $request->header('PAYPAL-TRANSMISSION-TIME', ''),
        ];

        if (in_array('', $headers, true)) {
            return false;
        }

        try {
            $client = new \GuzzleHttp\Client();
            $baseUrl = config('payments.paypal.sandbox', true)
                ? 'https://api-m.sandbox.paypal.com'
                : 'https://api-m.paypal.com';
            $res = $client->post($baseUrl.'/v1/notifications/verify-webhook-signature', [
                'headers' => [
                    'Authorization' => 'Bearer '.config('payments.paypal.access_token', ''),
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'auth_algo' => $headers['paypal-auth-algo'],
                    'cert_url' => $headers['paypal-cert-url'],
                    'transmission_id' => $headers['paypal-transmission-id'],
                    'transmission_sig' => $headers['paypal-transmission-sig'],
                    'transmission_time' => $headers['paypal-transmission-time'],
                    'webhook_id' => $webhookId,
                    'webhook_event' => $request->all(),
                ],
                'timeout' => 5,
            ]);

            $body = json_decode((string) $res->getBody(), true);

            return ($body['verification_status'] ?? '') === 'SUCCESS';
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('PayPal webhook verify failed: '.$e->getMessage());
            return false;
        }
    }

    /**
     * Spec 74: only valid state transitions are applied; anything else is
     * recorded as ignored so a stale provider event can never resurrect a
     * refunded/failed payment.
     */
    private function transition(Payment $payment, string $to, array $extra = []): array
    {
        if ($payment->status === $to) {
            return ['status' => 'processed', 'payment_id' => $payment->id];
        }

        if (!\Modules\Payments\Support\PaymentStateMachine::canTransition($payment->status, $to)) {
            return ['status' => 'ignored', 'payment_id' => $payment->id];
        }

        $payment->update(['status' => $to] + $extra);

        if ($to === Payment::STATUS_SUCCEEDED) {
            \Modules\Payments\Events\PaymentCompleted::dispatch($payment);
        }

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'payment.webhook_'.$to,
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'performed_by' => null,
                'new_values' => ['status' => $to, 'reference' => $payment->reference],
            ]);
        } catch (\Throwable) {
            // Audit must never break the webhook path.
        }

        return ['status' => 'processed', 'payment_id' => $payment->id];
    }

    private function handle(string $provider, Request $request, callable $apply): JsonResponse
    {
        $payload = $request->all();
        $eventId = (string) ($payload['id'] ?? $payload['data']['id'] ?? $request->header('X-Event-Id'));
        if ($eventId === '') {
            $eventId = sha1(json_encode($payload).$provider);
        }

        $id = (string) \Illuminate\Support\Str::uuid();
        try {
            // Insert-first makes dedupe atomic: a concurrent duplicate hits
            // the unique constraint instead of racing a read-then-write. The
            // nested transaction is a savepoint so the rejection never poisons
            // an outer transaction (pgsql 25P02).
            DB::transaction(function () use ($id, $provider, $eventId, $payload) {
                DB::table('payment_webhook_events')->insert([
                    'id' => $id,
                    'provider' => $provider,
                    'event_id' => $eventId,
                    'event_type' => $payload['event_type'] ?? $payload['type'] ?? $payload['event'] ?? null,
                    'payload' => json_encode($payload),
                    'status' => 'received',
                    'received_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                return response()->json(['status' => 'duplicate'], 200);
            }

            throw $e;
        }

        try {
            $result = $apply($payload);
            $status = is_array($result) ? ($result['status'] ?? 'processed') : 'processed';
            DB::table('payment_webhook_events')->where('id', $id)->update([
                'status' => $status,
                'payment_id' => is_array($result) ? ($result['payment_id'] ?? null) : null,
                'processed_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            DB::table('payment_webhook_events')->where('id', $id)->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
