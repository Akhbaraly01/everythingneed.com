<?php

namespace Modules\Bills\Actions;

use Core\Exceptions\ValidationException;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\WalletServiceInterface;
use Core\Support\KycGate;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Modules\Bills\Entities\BillPurchase;
use Modules\Bills\Support\BillCatalog;
use Modules\Bills\Support\BillProviderResolver;
use Modules\Payments\Entities\Payment;

class PurchaseBill
{
    public function __construct(
        private WalletServiceInterface $wallets,
        private AuditServiceInterface $audit,
        private BillProviderResolver $providers
    ) {}

    public function execute(string $userId, array $data): BillPurchase
    {
        $service = strtolower((string) ($data['service'] ?? ''));
        $country = strtoupper((string) ($data['country'] ?? ''));
        $currency = strtoupper((string) ($data['currency'] ?? ''));
        $amount = round((float) ($data['amount'] ?? 0), 2);
        $key = $data['idempotency_key'] ?? null;

        // 1. Catalog + availability (spec 30: country/currency/provider/availability).
        $catalog = BillCatalog::find($service);
        if ($catalog === null) {
            throw new ValidationException("Unknown bill service '{$service}'.");
        }

        $availability = BillCatalog::availability($service, $country, $currency);
        if (!$availability['available']) {
            throw new ValidationException('Bill service unavailable: '.implode('; ', $availability['reasons']));
        }

        $fields = $this->validateFields($catalog, (array) ($data['account_fields'] ?? []));

        if ($amount < (float) ($catalog['min_amount'] ?? 1)) {
            throw new ValidationException('Amount is below the minimum for this service.');
        }

        // 2. Idempotent replay: the same key returns the original purchase.
        if ($key) {
            $existing = BillPurchase::where('idempotency_key', $key)
                ->where('user_id', $userId)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        // 3. Verified identity (money leaves the wallet).
        KycGate::requireVerified($userId, 'Bill payments');

        // 4. Provider resolves BEFORE money moves (fail loudly, spec 30).
        // The availability check above already rejects unconfigured
        // providers; this guards direct action callers the same way.
        try {
            $provider = $this->providers->resolve();
        } catch (\InvalidArgumentException $e) {
            throw new ValidationException('Bill provider is not configured.');
        }

        // 5. Create pending rows (savepoint-safe for key races). Failed
        // attempts persist as failed rows - they are never rolled away, so
        // support can see what happened and no step is silently lost.
        try {
            $purchase = DB::transaction(fn () => BillPurchase::create([
                'user_id' => $userId,
                'service' => $service,
                'provider' => $provider->name(),
                'country' => $country,
                'currency' => $currency,
                'amount' => $amount,
                'account_fields' => $fields,
                'reference' => 'BILL-'.strtoupper(uniqid()),
                'idempotency_key' => $key,
                'status' => BillPurchase::STATUS_PENDING,
            ]));
        } catch (QueryException $e) {
            if ($key && (string) ($e->errorInfo[0] ?? '') === '23505') {
                return BillPurchase::where('idempotency_key', $key)
                    ->where('user_id', $userId)
                    ->firstOrFail();
            }

            throw $e;
        }

        $payment = Payment::create([
            'user_id' => $userId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Payment::STATUS_PENDING,
            'method' => 'wallet',
            'purpose' => 'bill_payment',
            'reference' => 'BILLPAY-'.strtoupper(uniqid()),
            'provider' => 'wallet',
            'gateway_response' => ['kind' => 'bill_payment', 'bill_reference' => $purchase->reference],
        ]);

        // 6. Manual providers never move money by themselves: the purchase
        // stays honestly pending until confirmed off-platform.
        if ($provider->name() === 'manual') {
            $this->audit('bill.pending', $userId, $purchase);

            return $purchase->fresh();
        }

        // 7. Debit the wallet (holds-aware), then vend.
        try {
            $this->wallets->debit(
                $userId,
                $amount,
                'BILL-PAY-'.$purchase->id,
                "Bill payment {$service} {$purchase->reference}"
            );
        } catch (\InvalidArgumentException $e) {
            $purchase->update(['status' => BillPurchase::STATUS_FAILED]);
            $payment->update(['status' => Payment::STATUS_FAILED]);
            throw new ValidationException('Insufficient wallet balance.');
        }

        try {
            $result = $provider->vend([
                'service' => $service,
                'country' => $country,
                'currency' => $currency,
                'amount' => $amount,
                'account_fields' => $fields,
                'reference' => $purchase->reference,
            ]);
        } catch (\Throwable $e) {
            // Reverse the debit: the purchase failed, so the money comes
            // back. The failure is surfaced, never a fake success.
            $this->wallets->topUp(
                $userId,
                $amount,
                'WALLET-REF-BILL-'.$purchase->id,
                "Reversal for {$purchase->reference}"
            );
            $purchase->update(['status' => BillPurchase::STATUS_FAILED, 'wallet_refunded' => true]);
            $payment->update(['status' => Payment::STATUS_FAILED]);
            $this->audit('bill.failed', $userId, $purchase, ['error' => $e->getMessage()]);

            throw new ValidationException('Bill provider unavailable: '.$e->getMessage());
        }

        if (($result['status'] ?? '') === 'pending_manual') {
            // Defensive: a driver that reports manual after debit keeps the
            // purchase pending with the money held in the wallet debit;
            // an administrator confirms or reverses it.
            $purchase->update([
                'status' => BillPurchase::STATUS_PENDING,
                'provider_reference' => $result['provider_reference'] ?? null,
                'provider_response' => $result['raw'] ?? null,
            ]);
            $payment->update(['status' => Payment::STATUS_PROCESSING]);
            $this->audit('bill.pending', $userId, $purchase);

            return $purchase->fresh();
        }

        $purchase->update([
            'status' => BillPurchase::STATUS_SUCCEEDED,
            'provider_reference' => $result['provider_reference'] ?? null,
            'provider_response' => $result['raw'] ?? null,
        ]);
        $payment->update([
            'status' => Payment::STATUS_SUCCEEDED,
            'provider_payment_id' => $result['provider_reference'] ?? null,
            'gateway_response' => ['kind' => 'bill_payment', 'bill_reference' => $purchase->reference],
        ]);

            \Modules\Payments\Events\PaymentCompleted::dispatch($payment);
            $this->audit('bill.purchased', $userId, $purchase);
            $this->notify($userId, 'Bill payment successful', "{$service} purchase {$purchase->reference} completed.", $purchase->id);

            return $purchase->fresh();
    }

    /**
     * Every declared field must be present and non-empty; phone-like fields
     * must look like phone numbers. Only known fields are stored.
     */
    private function validateFields(array $catalog, array $fields): array
    {
        $clean = [];
        foreach ($catalog['fields'] ?? [] as $field) {
            if ($field === 'amount') {
                continue;
            }

            $value = trim((string) ($fields[$field] ?? ''));
            if ($value === '') {
                throw new ValidationException("Field '{$field}' is required for this service.");
            }

            if (in_array($field, ['phone', 'meter_number', 'smartcard_number', 'account_id'], true)
                && !preg_match('/^\+?[0-9]{5,20}$/', preg_replace('/[\s-]/', '', $value))) {
                throw new ValidationException("Field '{$field}' does not look valid.");
            }

            if (mb_strlen($value) > 100) {
                throw new ValidationException("Field '{$field}' is too long.");
            }

            $clean[$field] = $value;
        }

        return $clean;
    }

    private function audit(string $action, string $userId, BillPurchase $purchase, array $extra = []): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'bill_purchase',
                'entity_id' => $purchase->id,
                'performed_by' => $userId,
                'new_values' => [
                    'service' => $purchase->service,
                    'status' => $purchase->status,
                    'amount' => (float) $purchase->amount,
                    'reference' => $purchase->reference,
                ] + $extra,
            ]);
        } catch (\Throwable) {
            // Audit must never break the money path.
        }
    }

    /** Spec 50 transactional fan-out; best-effort, never breaks money. */
    private function notify(string $userId, string $title, string $message, ?string $relatedId = null): void
    {
        try {
            app(\Core\Services\Contracts\NotificationServiceInterface::class)
                ->notify($userId, $title, $message, 'bill', $relatedId);
        } catch (\Throwable) {
        }
    }
}
