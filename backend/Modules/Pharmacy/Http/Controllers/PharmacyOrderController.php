<?php

namespace Modules\Pharmacy\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Pharmacy\Entities\Prescription;

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
        $validated = $request->validate([
            'prescription' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $path = $request->file('prescription')->store('prescriptions', 'public');

        // The upload is a real prescription row: the Rx gate (prescription
        // only medicines) and the admin prescriptions console both read the
        // `prescriptions` table, so the file alone never unlocked anything.
        $prescription = Prescription::create([
            'code' => 'RX-'.strtoupper(Str::random(8)),
            'patient_id' => $request->user()->id,
            'items' => [],
            'status' => Prescription::STATUS_ACTIVE,
            'notes' => collect([$validated['notes'] ?? null, 'Uploaded prescription: '.$path])
                ->filter()
                ->implode(' - '),
        ]);

        $order = MedicineOrder::create([
            'user_id' => $request->user()->id,
            'order_number' => 'MED-' . strtoupper(Str::random(8)),
            'delivery_address' => $request->input('delivery_address', 'Address on file'),
            'prescription_url' => $path,
            'prescription_id' => $prescription->id,
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
     * Customer-side cancellation. Pending orders only — once the pharmacy
     * confirms, fulfillment has started and staff must cancel from the
     * console (which also handles the restock). Mirrors the admin guard
     * one step stricter and always restocks the reserved medicine units.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = MedicineOrder::with('items')
            ->where('user_id', $request->user()->id)
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->status !== MedicineOrder::STATUS_PENDING) {
            return response()->json([
                'message' => "Only pending orders can be cancelled (current: {$order->status}).",
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                \Modules\Pharmacy\Entities\Medicine::where('id', $item->medicine_id)
                    ->increment('stock_quantity', $item->quantity);
            }
            $order->update(['status' => MedicineOrder::STATUS_CANCELLED]);
        });

        return response()->json(['data' => $order->fresh('items')]);
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
