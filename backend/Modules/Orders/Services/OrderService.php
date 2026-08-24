<?php

namespace Modules\Orders\Services;

use Modules\Orders\Actions\PlaceOrder;
use Modules\Orders\Actions\CancelOrder;
use Modules\Orders\Entities\MedicineOrder;

class OrderService
{
    public function __construct(
        private PlaceOrder $placeOrder,
        private CancelOrder $cancelOrder,
    ) {}

    public function placeOrder(array $data): object
    {
        return $this->placeOrder->execute($data);
    }

    public function cancelOrder(string $orderId, ?string $reason = null): object
    {
        return $this->cancelOrder->execute($orderId, $reason);
    }

    public function getOrder(string $orderId): ?MedicineOrder
    {
        return MedicineOrder::with(['items.medicine', 'user'])->find($orderId);
    }

    public function getUserOrders(string $userId, int $page = 1, int $perPage = 15): object
    {
        return MedicineOrder::with(['items.medicine'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
