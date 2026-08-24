<?php

namespace Core\Services;

use Core\Services\Contracts\PaymentGatewayInterface;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

class PaymentGateway extends BaseService implements PaymentGatewayInterface
{
    public function charge(array $data): array
    {
        $payment = Payment::create([
            'order_id' => $data['order_id'] ?? null,
            'user_id' => $data['user_id'],
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'USD',
            'status' => Payment::STATUS_PENDING,
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'gateway_response' => null,
        ]);

        try {
            $gatewayResponse = $this->processWithGateway($data);
            $payment->update([
                'status' => Payment::STATUS_SUCCEEDED,
                'gateway_response' => $gatewayResponse,
                'reference' => $gatewayResponse['transaction_id'] ?? $payment->reference,
            ]);

            return [
                'success' => true,
                'payment_id' => $payment->id,
                'reference' => $payment->reference,
                'amount' => $payment->amount,
                'status' => $payment->status,
            ];
        } catch (\Exception $e) {
            $payment->update([
                'status' => Payment::STATUS_FAILED,
                'gateway_response' => ['error' => $e->getMessage()],
            ]);

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

        if ($payment->status !== Payment::STATUS_SUCCEEDED) {
            throw new \InvalidArgumentException('Only succeeded payments can be refunded.');
        }

        $refundAmount = $data['amount'] ?? $payment->amount;

        $refund = Refund::create([
            'payment_id' => $payment->id,
            'amount' => $refundAmount,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        try {
            $gatewayResponse = $this->processRefundWithGateway($payment, $refundAmount);
            $refund->update([
                'status' => 'succeeded',
                'gateway_response' => $gatewayResponse,
            ]);

            $newStatus = $refundAmount < $payment->amount
                ? Payment::STATUS_PARTIALLY_REFUNDED
                : Payment::STATUS_REFUNDED;
            $payment->update(['status' => $newStatus]);

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'amount' => $refundAmount,
                'status' => 'succeeded',
            ];
        } catch (\Exception $e) {
            $refund->update([
                'status' => 'failed',
                'gateway_response' => ['error' => $e->getMessage()],
            ]);

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

    private function processWithGateway(array $data): array
    {
        // Placeholder for actual gateway integration (Stripe, PayPal, etc.)
        return [
            'transaction_id' => 'txn_' . bin2hex(random_bytes(12)),
            'status' => 'completed',
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'USD',
        ];
    }

    private function processRefundWithGateway(Payment $payment, float $amount): array
    {
        return [
            'refund_id' => 'ref_' . bin2hex(random_bytes(12)),
            'status' => 'completed',
            'amount' => $amount,
        ];
    }
}
