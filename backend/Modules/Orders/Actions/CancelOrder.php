<?php

namespace Modules\Orders\Actions;

use Modules\Orders\Entities\MedicineOrder;
use Core\Exceptions\NotFoundException;

class CancelOrder
{
    public function execute(string $orderId, ?string $reason = null): object
    {
        $order = MedicineOrder::find($orderId);

        if (!$order) {
            throw new NotFoundException('Order', $orderId);
        }

        if (in_array($order->status, ['shipped', 'delivered'])) {
            throw new \Core\Exceptions\ValidationException('Cannot cancel order in current status');
        }

        // Restore stock
        foreach ($order->items as $item) {
            $item->medicine->increment('stock_quantity', $item->quantity);
        }

        $order->update(['status' => 'cancelled']);

        return $order->fresh();
    }
}
