<?php

namespace Modules\Payments\Actions;

use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class RefundPayment
{
    public function execute(string $paymentId, ?float $amount = null): object
    {
        $payment = Payment::find($paymentId);

        if (!$payment) {
            throw new NotFoundException('Payment', $paymentId);
        }

        if ($payment->status !== 'succeeded') {
            throw new ValidationException('Payment cannot be refunded');
        }

        $refundAmount = $amount ?? $payment->amount;

        if ($refundAmount > $payment->amount) {
            throw new ValidationException('Refund amount exceeds payment amount');
        }

        $refund = Refund::create([
            'payment_id' => $paymentId,
            'amount' => $refundAmount,
            'status' => 'pending',
        ]);

        // In production, call payment gateway refund here
        $refund->update(['status' => 'completed']);
        $payment->update(['status' => $refundAmount >= $payment->amount ? 'refunded' : 'partially_refunded']);

        // Marketplace product orders: mark refunded and restock.
        $order = $payment->order_id
            ? \Modules\Orders\Entities\Order::with('items')->find($payment->order_id)
            : null;

        if ($order && $refundAmount >= (float) $payment->amount) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        \Modules\Products\Entities\Product::where('id', $item->product_id)
                            ->increment('stock_quantity', $item->quantity);
                    }
                }

                $order->update(['status' => \Modules\Orders\Entities\Order::STATUS_REFUNDED]);

                \Modules\Orders\Entities\OrderTracking::create([
                    'order_id' => $order->id,
                    'order_type' => 'product',
                    'user_id' => $order->user_id,
                    'status' => \Modules\Orders\Entities\Order::STATUS_REFUNDED,
                    'status_message' => 'Order refunded — stock restored',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Modules\Orders\Events\OrderStatusUpdated::dispatch(
                    \Modules\Orders\Entities\OrderTracking::where('order_id', $order->id)
                        ->orderByDesc('created_at')->first()
                );
            });
        }

        return $refund->fresh();
    }
}
