<?php

namespace Modules\Orders\Actions;

use Modules\Orders\Entities\MedicineOrder;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class FulfillOrder
{
    public function execute(string $orderId, array $trackingData = []): object
    {
        $order = MedicineOrder::find($orderId);

        if (!$order) {
            throw new NotFoundException('Order', $orderId);
        }

        if (!in_array($order->status, ['confirmed', 'processing'])) {
            throw new ValidationException('Order cannot be fulfilled in current status');
        }

        $order->update(['status' => 'shipped']);

        if (!empty($trackingData)) {
            \Modules\Orders\Entities\OrderTracking::create(array_merge($trackingData, [
                'order_id' => $order->id,
            ]));
        }

        return $order->fresh();
    }
}
