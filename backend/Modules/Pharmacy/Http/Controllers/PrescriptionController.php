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

class PrescriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prescription::where('patient_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $prescriptions = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $prescriptions->items(),
            'meta' => [
                'current_page' => $prescriptions->currentPage(),
                'last_page' => $prescriptions->lastPage(),
                'per_page' => $prescriptions->perPage(),
                'total' => $prescriptions->total(),
            ],
        ]);
    }

    /**
     * A single prescription (own records only) with its fulfilment orders.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $prescription = Prescription::where('patient_id', $request->user()->id)
            ->with(['doctor:id,full_name,specialization', 'orders:id,prescription_id,order_number,status,total_amount,created_at'])
            ->find($id);

        if (!$prescription) {
            return response()->json(['message' => 'Prescription not found'], 404);
        }

        return response()->json(['data' => $prescription]);
    }

    /**
     * Order the medicines on an active prescription (send-to-pharmacy).
     *
     * Spec 25: the order is linked back to the prescription so fulfilment can
     * mark it filled on delivery. Items are matched against the real catalogue
     * by name/generic name; unmatched items are reported, not silently dropped.
     */
    public function order(Request $request, string $id): JsonResponse
    {
        $prescription = Prescription::where('patient_id', $request->user()->id)->find($id);

        if (!$prescription) {
            return response()->json(['message' => 'Prescription not found'], 404);
        }

        if ($prescription->isExpired() || $prescription->status === Prescription::STATUS_EXPIRED) {
            return response()->json(['message' => 'This prescription has expired'], 422);
        }

        if ($prescription->status !== Prescription::STATUS_ACTIVE) {
            return response()->json(['message' => 'Only active prescriptions can be ordered'], 422);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string|max:200',
            'items.*.quantity' => 'nullable|integer|min:1',
            'delivery_address' => 'nullable|string|max:500',
        ]);

        $result = \Illuminate\Support\Facades\DB::transaction(function () use ($prescription, $validated) {
            $order = MedicineOrder::create([
                'user_id' => $prescription->patient_id,
                'order_number' => 'MED-' . strtoupper(Str::random(8)),
                'delivery_address' => $validated['delivery_address'] ?? 'Address on file',
                'prescription_id' => $prescription->id,
                'total_amount' => 0,
                'status' => MedicineOrder::STATUS_PENDING,
            ]);

            $total = 0;
            $matched = [];
            $unmatched = [];

            foreach ($validated['items'] as $it) {
                $qty = max(1, (int) ($it['quantity'] ?? 1));
                $name = $it['name'];

                $medicine = Medicine::where('requires_prescription', true)
                    ->where(function ($q) use ($name) {
                        $q->where('name', 'ilike', $name)
                            ->orWhere('generic_name', 'ilike', $name)
                            ->orWhere('name', 'ilike', "%{$name}%");
                    })
                    ->where('deleted_at', null)
                    ->lockForUpdate()
                    ->first();

                if (!$medicine) {
                    $unmatched[] = $name;
                    continue;
                }

                if ($medicine->stock_quantity < $qty) {
                    abort(response()->json(['message' => "Insufficient stock for {$medicine->name}"], 422));
                }

                MedicineOrderItem::create([
                    'order_id' => $order->id,
                    'medicine_id' => $medicine->id,
                    'quantity' => $qty,
                    'unit_price' => $medicine->price,
                ]);
                $medicine->decrement('stock_quantity', $qty);
                $total += (float) $medicine->price * $qty;
                $matched[] = ['name' => $medicine->name, 'quantity' => $qty];
            }

            if (empty($matched)) {
                abort(response()->json([
                    'message' => 'None of the prescription items are available in the pharmacy catalogue',
                    'unmatched' => $unmatched,
                ], 422));
            }

            $order->update(['total_amount' => $total]);

            return [
                'order' => $order->fresh('items'),
                'matched' => $matched,
                'unmatched' => $unmatched,
            ];
        });

        return response()->json([
            'data' => $result['order'],
            'matched' => $result['matched'],
            'unmatched' => $result['unmatched'],
        ], 201);
    }
}
