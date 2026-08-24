<?php

namespace Modules\Payments\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderTracking;
use Modules\Payments\Entities\Payment;
use Core\Exceptions\ValidationException;
use Core\Exceptions\ForbiddenException;

class ChargePayment
{
    public function execute(array $data): object
    {
        return DB::transaction(function () use ($data) {
            $order = !empty($data['order_id'])
                ? Order::where('id', $data['order_id'])->lockForUpdate()->first()
                : null;

            // Marketplace product orders get full server-side validation.
            if ($order) {
                if ($order->user_id !== $data['user_id']) {
                    throw new ForbiddenException('You cannot pay for another user\'s order');
                }

                if ($order->status !== Order::STATUS_PENDING) {
                    throw new ValidationException("Order is not payable in status '{$order->status}'");
                }

                if (isset($data['amount']) && bccomp((string) $data['amount'], (string) $order->total_amount, 2) !== 0) {
                    throw new ValidationException('Amount does not match the order total');
                }

                $data['amount'] = $order->total_amount;
                $data['currency'] = $order->currency;
            }

            $payment = Payment::create([
                'order_id' => $data['order_id'] ?? null,
                'user_id' => $data['user_id'],
                'amount' => $data['amount'],
                'currency' => $data['currency'] ?? 'USD',
                'status' => 'pending',
                'method' => $data['method'],
                'reference' => $this->generateReference(),
                'gateway_response' => json_encode([
                    'provider' => 'everythingneed-pay',
                    'transaction_id' => 'TXN-'.strtoupper(uniqid()),
                    'mode' => config('app.env') === 'production' ? 'live' : 'test',
                ]),
            ]);

            // Simulated gateway: deterministic success path.
            $payment->update(['status' => 'succeeded']);

            if ($order) {
                $order->update(['status' => Order::STATUS_PAID]);

                \Modules\Orders\Entities\VendorOrder::where('order_id', $order->id)
                    ->where('status', 'pending')
                    ->update(['status' => 'paid']);

                OrderTracking::create([
                    'order_id' => $order->id,
                    'order_type' => 'product',
                    'user_id' => $order->user_id,
                    'status' => Order::STATUS_PAID,
                    'status_message' => "Payment received ({$payment->reference})",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch(
                    OrderTracking::where('order_id', $order->id)->orderByDesc('created_at')->first()
                );
            }

            return $payment->fresh();
        });
    }

    private function generateReference(): string
    {
        return 'PAY-' . strtoupper(uniqid());
    }
}
