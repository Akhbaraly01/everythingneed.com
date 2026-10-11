<?php

namespace Core\Services;

use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Services\Gateways\GatewayDriverResolver;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

class PaymentGateway extends BaseService implements PaymentGatewayInterface
{
    public function __construct(
        private GatewayDriverResolver $drivers
    ) {}

    public function charge(array $data): array
    {
        // Guardrail: the mock driver may only run in explicit development or
        // testing contexts (spec 73) - never in any other environment.
        if (config('payments.driver') === 'mock'
            && !config('payments.allow_mock_in_production')
            && !$this->isExplicitDevEnvironment()) {
            throw new \RuntimeException('Mock payment driver is disabled outside local/testing. Set PAYMENTS_DRIVER.');
        }

        // Idempotent charge: same key returns the original result.
        $idempotencyKey = $data['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $existing = Payment::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $this->idempotentResult($existing);
            }
        }

        // Resolve before touching money rows: a misconfigured driver name
        // must fail loudly (spec 73), never degrade into a silent mock run.
        $driver = $this->drivers->resolve();

        try {
            // Nested transaction = savepoint, so a unique-violation replay
            // below never poisons an outer transaction (pgsql 25P02).
            $payment = DB::transaction(fn () => Payment::create([
                'order_id' => $data['order_id'] ?? null,
                'user_id' => $data['user_id'],
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? \Core\Support\Currencies::default(),
                'status' => Payment::STATUS_PENDING,
                'method' => $data['method'],
                'purpose' => $data['purpose'] ?? null,
                'reference' => $data['reference'] ?? ('PAY-'.strtoupper(bin2hex(random_bytes(6)))),
                'idempotency_key' => $idempotencyKey,
                'provider' => config('payments.driver'),
                'metadata' => $data['metadata'] ?? null,
                'gateway_response' => null,
            ]));
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique idempotency_key violation = a concurrent request won the
            // race; treat the row as replayed instead of double-charging.
            if ($idempotencyKey && (string) $e->errorInfo[0] === '23505') {
                $existing = Payment::where('idempotency_key', $idempotencyKey)->first();
                if ($existing) {
                    return $this->idempotentResult($existing);
                }
            }

            throw $e;
        }

        try {
            $gatewayResponse = $driver->charge($data + ['reference' => $payment->reference]);

            $payment->update([
                // Manual/async drivers leave the payment awaiting verification.
                'status' => ($gatewayResponse['status'] ?? '') === 'pending_manual'
                    ? Payment::STATUS_PROCESSING
                    : Payment::STATUS_SUCCEEDED,
                'gateway_response' => $gatewayResponse,
                'provider' => $gatewayResponse['provider'] ?? $driver->name(),
                'provider_payment_id' => $gatewayResponse['transaction_id'] ?? null,
                // Keep the original unique reference; provider txn lives in provider_payment_id.
            ]);

            if ($payment->status === Payment::STATUS_SUCCEEDED) {
                \Modules\Payments\Events\PaymentCompleted::dispatch($payment);
            }

            $this->audit('payment.charged', $payment, null, [
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
            ]);

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'reference' => $payment->reference,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'requires_verification' => $payment->status === Payment::STATUS_PROCESSING,
            ];
        } catch (\Exception $e) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => ['error' => $e->getMessage()],
            ]);

            $this->audit('payment.failed', $payment, null, ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function refund(array $data): array
    {
        $payment = Payment::findOrFail($data['payment_id']);

        if (!in_array($payment->status, [Payment::STATUS_SUCCEEDED, Payment::STATUS_PARTIALLY_REFUNDED], true)) {
            throw new \InvalidArgumentException('Only succeeded payments can be refunded.');
        }

        $refundAmount = $data['amount'] ?? $payment->amount;

        // Gap 3: an approved refund REQUEST carries its own row — process it
        // in place instead of creating a second refund for the same money.
        $refund = null;
        if (!empty($data['refund_id'])) {
            $refund = Refund::find($data['refund_id']);
            if (!$refund || $refund->payment_id !== $payment->id) {
                throw new \InvalidArgumentException('Refund request not found for this payment.');
            }
            if (!in_array($refund->status, ['pending', 'approved'], true)) {
                throw new \InvalidArgumentException('Refund request has already been processed.');
            }
        }

        // Chained partial refunds: total refunds may never exceed the charge.
        $alreadyRefunded = (float) Refund::where('payment_id', $payment->id)
            ->whereIn('status', ['succeeded', 'completed'])
            ->sum('amount');
        if ($alreadyRefunded + (float) $refundAmount > (float) $payment->amount + 0.0001) {
            throw new \InvalidArgumentException('Refund amount exceeds refundable balance.');
        }

        if (!$refund) {
            $refund = Refund::create([
                'payment_id' => $payment->id,
                'amount' => $refundAmount,
                'reason' => $data['reason'] ?? null,
                'status' => 'pending',
            ]);
        } else {
            // An approved request may be processed for less than filed
            // (support override) — keep the row's amount the paid amount.
            $refund->update(['amount' => $refundAmount]);
        }

        try {
            $driver = $this->drivers->resolve();
            $gatewayResponse = $driver->refund(
                $payment->toArray(),
                (float) $refundAmount,
                ['provider_payment_id' => $payment->provider_payment_id],
            );

            $succeeded = ($gatewayResponse['status'] ?? '') !== 'pending_manual';
            $refund->update([
                'status' => $succeeded ? 'succeeded' : 'pending',
                'gateway_response' => $gatewayResponse,
            ]);

            if ($succeeded) {
                \Modules\Payments\Events\RefundProcessed::dispatch($refund->fresh());

                $totalRefunded = $alreadyRefunded + (float) $refundAmount;
                $newStatus = $totalRefunded >= (float) $payment->amount - 0.0001
                    ? Payment::STATUS_REFUNDED
                    : Payment::STATUS_PARTIALLY_REFUNDED;
                $payment->update(['status' => $newStatus]);

                $this->audit('payment.refunded', $payment, null, [
                    'refund_id' => $refund->id,
                    'amount' => (float) $refundAmount,
                ]);
            }

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'amount' => $refundAmount,
                'status' => $succeeded ? 'succeeded' : 'pending',
            ];
        } catch (\Exception $e) {
            $refund->update([
                'status' => 'failed',
                'gateway_response' => ['error' => $e->getMessage()],
            ]);

            $this->audit('payment.refund_failed', $payment, null, ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getPayment(string $id): ?object
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return null;
        }

        return (object) $payment->toArray();
    }

    public function attachMethod(string $userId, array $methodData): array
    {
        // Store payment method reference for future charges
        $methodKey = "payment_methods:{$userId}";
        $methods = cache()->get($methodKey, []);

        $method = [
            'id' => bin2hex(random_bytes(16)),
            'type' => $methodData['type'],
            'last_four' => $methodData['last_four'] ?? null,
            'brand' => $methodData['brand'] ?? null,
            'is_default' => $methodData['is_default'] ?? empty($methods),
            'created_at' => now()->toIso8601String(),
        ];

        $methods[] = $method;
        cache()->put($methodKey, $methods, now()->addDays(365));

        return $method;
    }

    public function savedMethods(string $userId): array
    {
        return array_values(cache()->get("payment_methods:{$userId}", []));
    }

    public function detachMethod(string $userId, string $methodId): bool
    {
        $methodKey = "payment_methods:{$userId}";
        $methods = cache()->get($methodKey, []);

        $kept = array_values(array_filter(
            $methods,
            fn ($method) => ($method['id'] ?? null) !== $methodId
        ));

        if (count($kept) === count($methods)) {
            return false;
        }

        cache()->put($methodKey, $kept, now()->addDays(365));

        return true;
    }

    private function isExplicitDevEnvironment(): bool
    {
        // Both the runtime environment and the config value must agree on an
        // explicit development/testing context (spec 73).
        return in_array((string) config('app.env'), ['local', 'testing'], true)
            && app()->environment(['local', 'testing']);
    }

    private function idempotentResult(Payment $existing): array
    {
        return [
            'success' => in_array($existing->status, [Payment::STATUS_SUCCEEDED, Payment::STATUS_PROCESSING], true),
            'payment_id' => $existing->id,
            'reference' => $existing->reference,
            'amount' => $existing->amount,
            'status' => $existing->status,
            'requires_verification' => $existing->status === Payment::STATUS_PROCESSING,
            'idempotent' => true,
        ];
    }

    private function audit(string $action, Payment $payment, ?string $actorId, array $new = []): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'payment',
                'entity_id' => $payment->id,
                'performed_by' => $actorId,
                'new_values' => $new + ['status' => $payment->status, 'reference' => $payment->reference],
            ]);
        } catch (\Throwable) {
            // Audit must never break the money path.
        }
    }
}
