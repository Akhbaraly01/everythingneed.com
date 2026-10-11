<?php

namespace Modules\Pharmacy\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Pharmacy\Entities\Medicine;

/**
 * Pharmacy order endpoints (previously route closures).
 */
class PharmacyOrderController extends Controller
{
    /**
     * Upload a prescription image and open a review order.
     */
    public function storePrescription(Request $request): JsonResponse
    {
        $request->validate([
            'prescription' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $path = $request->file('prescription')->store('prescriptions', 'public');

        $order = MedicineOrder::create([
            'user_id' => $request->user()->id,
            'order_number' => 'MED-' . strtoupper(Str::random(8)),
            'delivery_address' => $request->input('delivery_address', 'Address on file'),
            'prescription_url' => $path,
            'total_amount' => 0,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $order], 201);
    }

    /**
     * The current user's medicine orders.
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = MedicineOrder::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    /**
     * A single medicine order (own records only).
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = MedicineOrder::where('user_id', $request->user()->id)
            ->with('items')
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['data' => $order]);
    }

    /**
     * Place a medicine order with line items.
     *
     * Spec 25: prescription-only medicines require an active prescription,
     * and stock is checked and decremented atomically. Medicines without
     * those flags order exactly as before.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_address' => 'nullable|string|max:500',
        ]);

        return response()->json([
            'data' => \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated) {
                $total = 0;
                $lines = [];
                $needsPrescription = false;

                foreach ($validated['items'] as $it) {
                    $medicine = Medicine::where('id', $it['medicine_id'])->lockForUpdate()->first();
                    if (!$medicine) {
                        abort(response()->json(['message' => 'Medicine not found'], 404));
                    }
                    if ($medicine->stock_quantity < (int) $it['quantity']) {
                        abort(response()->json(['message' => "Insufficient stock for {$medicine->name}"], 422));
                    }
                    $total += (float) $medicine->price * (int) $it['quantity'];
                    $lines[] = ['medicine' => $medicine, 'quantity' => (int) $it['quantity']];
                    $needsPrescription = $needsPrescription || (bool) $medicine->requires_prescription;
                }

                if ($needsPrescription) {
                    $hasActive = \Modules\Pharmacy\Entities\Prescription::where('patient_id', $request->user()->id)
                        ->where('status', \Modules\Pharmacy\Entities\Prescription::STATUS_ACTIVE)
                        ->exists();
                    if (!$hasActive) {
                        abort(response()->json(['message' => 'An active prescription is required for one or more items'], 422));
                    }
                }

                $order = MedicineOrder::create([
                    'user_id' => $request->user()->id,
                    'order_number' => 'MED-' . strtoupper(Str::random(8)),
                    'delivery_address' => $validated['delivery_address'] ?? 'Address on file',
                    'total_amount' => $total,
                    'status' => 'pending',
                ]);

                foreach ($lines as $line) {
                    MedicineOrderItem::create([
                        'order_id' => $order->id,
                        'medicine_id' => $line['medicine']->id,
                        'quantity' => $line['quantity'],
                        'unit_price' => $line['medicine']->price,
                    ]);
                    $line['medicine']->decrement('stock_quantity', $line['quantity']);
                }

                return $order->fresh('items');
            }),
        ], 201);
    }
}
