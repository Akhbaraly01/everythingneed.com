<?php

namespace Modules\Orders\Actions;

use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Orders\Entities\VendorOrder;
use Modules\Pharmacy\Entities\Medicine;
use Core\Exceptions\ValidationException;

class PlaceOrder
{
    public function execute(array $data): object
    {
        $order = MedicineOrder::create([
            'user_id' => $data['user_id'],
            'order_number' => $this->generateOrderNumber(),
            'delivery_address' => $data['delivery_address'],
            'prescription_url' => $data['prescription_url'] ?? null,
            'total_amount' => 0,
            'status' => 'pending',
        ]);

        $total = 0;
        foreach ($data['items'] as $item) {
            $medicine = \Illuminate\Support\Facades\DB::transaction(function () use ($item) {
                return Medicine::where('id', $item['medicine_id'])->lockForUpdate()->first();
            });

            if (!$medicine) {
                throw new ValidationException("Medicine not found: {$item['medicine_id']}");
            }

            if ($medicine->stock_quantity < $item['quantity']) {
                throw new ValidationException("Insufficient stock for {$medicine->name}");
            }

            $medicine->decrement('stock_quantity', $item['quantity']);

            // Server-side price only — never trust the client.
            $unitPrice = (float) $medicine->price;

            $orderItem = MedicineOrderItem::create([
                'order_id' => $order->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
            ]);

            $total += $unitPrice * $item['quantity'];
        }

        $order->update(['total_amount' => $total]);

        return $order->fresh('items');
    }

    private function generateOrderNumber(): string
    {
        return 'PH-' . strtoupper(uniqid());
    }
}
