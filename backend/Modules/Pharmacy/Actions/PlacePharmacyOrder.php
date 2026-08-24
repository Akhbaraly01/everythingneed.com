<?php

namespace Modules\Pharmacy\Actions;

use Modules\Pharmacy\Entities\Medicine;
use Modules\Pharmacy\Entities\CartItem;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Str;

class PlacePharmacyOrder
{
    public function execute(array $data): object
    {
        $items = $data['items'] ?? [];

        if (empty($items)) {
            throw new ValidationException('Order must contain at least one item');
        }

        $order = MedicineOrder::create([
            'user_id' => $data['user_id'],
            'order_number' => 'PH-' . strtoupper(Str::random(8)),
            'delivery_address' => $data['delivery_address'],
            'prescription_url' => $data['prescription_url'] ?? null,
            'total_amount' => 0,
            'status' => 'pending',
        ]);

        $total = 0;

        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);

            if (!$medicine) {
                throw new ValidationException("Medicine not found: {$item['medicine_id']}");
            }

            if ($medicine->requires_prescription && empty($data['prescription_url'])) {
                throw new ValidationException("Prescription required for {$medicine->name}");
            }

            if ($medicine->stock_quantity < $item['quantity']) {
                throw new ValidationException("Insufficient stock for {$medicine->name}");
            }

            $medicine->decrement('stock_quantity', $item['quantity']);

            MedicineOrderItem::create([
                'order_id' => $order->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $medicine->price,
            ]);

            $total += $medicine->price * $item['quantity'];
        }

        $order->update(['total_amount' => $total]);

        CartItem::where('user_id', $data['user_id'])->delete();

        return $order->fresh('items');
    }
}
