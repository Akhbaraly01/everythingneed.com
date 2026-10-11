<?php

namespace Modules\Pharmacy\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Entities\MedicineOrder;

/**
 * Pharmacy fulfillment console (W4): drives medicine orders through
 * pending -> confirmed -> processing -> shipped -> delivered, with
 * cancellation (pending/confirmed only) that restocks the reserved
 * quantities. Supersedes the orphaned Orders\Actions\FulfillOrder,
 * which had no callers and skipped the confirmation stages.
 */
class PharmacyAdminController extends Controller
{
    /** POST /api/admin/pharmacy/orders/{id}/confirm */
    public function confirm(string $id): JsonResponse
    {
        return $this->transition($id, MedicineOrder::STATUS_PENDING, MedicineOrder::STATUS_CONFIRMED);
    }

    /** POST /api/admin/pharmacy/orders/{id}/process */
    public function process(string $id): JsonResponse
    {
        return $this->transition($id, MedicineOrder::STATUS_CONFIRMED, MedicineOrder::STATUS_PROCESSING);
    }

    /** POST /api/admin/pharmacy/orders/{id}/ship */
    public function ship(string $id): JsonResponse
    {
        return $this->transition($id, MedicineOrder::STATUS_PROCESSING, MedicineOrder::STATUS_SHIPPED);
    }

    /** POST /api/admin/pharmacy/orders/{id}/deliver */
    public function deliver(string $id): JsonResponse
    {
        return $this->transition($id, MedicineOrder::STATUS_SHIPPED, MedicineOrder::STATUS_DELIVERED);
    }

    /** POST /api/admin/pharmacy/orders/{id}/cancel */
    public function cancel(string $id): JsonResponse
    {
        $order = MedicineOrder::with('items')->find($id);
        abort_unless($order !== null, 404, 'Order not found');

        if (! in_array($order->status, [MedicineOrder::STATUS_PENDING, MedicineOrder::STATUS_CONFIRMED], true)) {
            return response()->json([
                'message' => "Only pending or confirmed orders can be cancelled (current: {$order->status}).",
            ], 422);
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                \Modules\Pharmacy\Entities\Medicine::where('id', $item->medicine_id)
                    ->increment('stock_quantity', $item->quantity);
            }
            $order->update(['status' => MedicineOrder::STATUS_CANCELLED]);
        });

        return response()->json(['data' => $order->fresh('items')]);
    }

    /**
     * GET /api/admin/pharmacy/prescriptions
     *
     * Oversight across every prescription (any patient) with its doctor and
     * linked fulfilment orders. Filterable by status.
     */
    public function prescriptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,active,filled,expired'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = \Modules\Pharmacy\Entities\Prescription::query()
            ->with(['patient:id,name,email', 'doctor:id,full_name,specialization'])
            ->orderByDesc('created_at');

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $page = (int) ($validated['page'] ?? 1);

        // Same envelope as the orders tab ({data, meta:{page,...}}) so the
        // shared pagination block in admin/Pharmacy.tsx can drive both.
        return response()->json([
            'data'  => (clone $query)->offset(($page - 1) * 15)->limit(15)->get(),
            'total' => (clone $query)->count(),
            'meta'  => ['page' => $page, 'per_page' => 15, 'total' => (clone $query)->count()],
        ]);
    }

    private function transition(string $id, string $from, string $to): JsonResponse
    {
        $order = MedicineOrder::find($id);
        abort_unless($order !== null, 404, 'Order not found');

        if ($order->status !== $from) {
            return response()->json([
                'message' => "Order cannot move to {$to} from {$order->status}.",
            ], 422);
        }

        $order->update(['status' => $to]);

        // H-B: delivery fulfils the linked prescription.
        if ($to === MedicineOrder::STATUS_DELIVERED && $order->prescription_id) {
            \Modules\Pharmacy\Entities\Prescription::where('id', $order->prescription_id)
                ->where('status', \Modules\Pharmacy\Entities\Prescription::STATUS_ACTIVE)
                ->update(['status' => \Modules\Pharmacy\Entities\Prescription::STATUS_FILLED]);
        }

        return response()->json(['data' => $order->fresh('items')]);
    }
}
