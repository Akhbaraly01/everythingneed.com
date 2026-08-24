<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * AdminOrderController — Order management endpoints for the admin panel.
 */
class AdminOrderController extends Controller
{
    private const VALID_STATUSES = ['pending', 'processing', 'in_progress', 'completed', 'cancelled', 'refunded'];

    /**
     * Paginated list of all orders with filters.
     *
     * GET /api/admin/orders
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'     => ['nullable', 'string', 'max:100'],
            'status'     => ['nullable', 'string', 'in:' . implode(',', self::VALID_STATUSES)],
            'vendor_id'  => ['nullable', 'string'],
            'date_from'  => ['nullable', 'date'],
            'date_to'    => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page'   => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'       => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('vendor_orders as o')
            ->leftJoin('users as u', 'u.id', '=', 'o.customer_id')
            ->leftJoin('vendors as v', 'v.id', '=', 'o.vendor_id')
            ->whereNull('o.deleted_at')
            ->select([
                'o.id', 'o.order_number', 'o.status', 'o.total_price',
                'o.created_at', 'u.name as customer_name', 'v.store_name as vendor_name',
            ]);

        if (! empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(fn ($q) => $q->where('o.order_number', 'like', $term)
                ->orWhere('u.name', 'like', $term));
        }

        if (! empty($validated['status'])) {
            $query->where('o.status', $validated['status']);
        }

        if (! empty($validated['vendor_id'])) {
            $query->where('o.vendor_id', $validated['vendor_id']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('o.created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('o.created_at', '<=', $validated['date_to']);
        }

        $perPage = (int) ($validated['per_page'] ?? 20);
        $page    = (int) ($validated['page'] ?? 1);
        $total   = $query->count();
        $orders  = $query->orderByDesc('o.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return response()->json([
            'data' => $orders,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ]);
    }

    /**
     * Returns full order detail.
     *
     * GET /api/admin/orders/{id}
     */
    public function show(string $id): JsonResponse
    {
        $order = DB::table('vendor_orders as o')
            ->leftJoin('users as u', 'u.id', '=', 'o.customer_id')
            ->leftJoin('vendors as v', 'v.id', '=', 'o.vendor_id')
            ->where('o.id', $id)
            ->whereNull('o.deleted_at')
            ->select(['o.*', 'u.name as customer_name', 'u.email as customer_email', 'v.store_name as vendor_name'])
            ->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['data' => $order]);
    }

    /**
     * Updates order status.
     *
     * PUT /api/admin/orders/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', self::VALID_STATUSES)],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $affected = DB::table('vendor_orders')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['status' => $validated['status'], 'updated_at' => now()]);

        if (! $affected) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $this->logAudit('update', 'order', $id, "Status updated to {$validated['status']}" . (! empty($validated['reason']) ? ": {$validated['reason']}" : ''));

        return response()->json(['message' => 'Order status updated']);
    }

    /**
     * Issues a refund for a completed order.
     *
     * POST /api/admin/orders/{id}/refund
     */
    public function refund(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $order = DB::table('vendor_orders')->where('id', $id)->whereNull('deleted_at')->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->status === 'refunded') {
            return response()->json(['message' => 'Order already refunded'], 422);
        }

        DB::table('vendor_orders')
            ->where('id', $id)
            ->update(['status' => 'refunded', 'updated_at' => now()]);

        $this->logAudit('update', 'order', $id, 'Refund issued' . (! empty($validated['reason']) ? ": {$validated['reason']}" : ''));

        return response()->json(['message' => 'Refund issued successfully']);
    }

    /**
     * Writes an audit log entry.
     */
    private function logAudit(string $action, string $entityType, string $entityId, string $details): void
    {
        try {
            DB::table('audit_logs')->insert([
                'id'           => Str::uuid()->toString(),
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'new_values'   => json_encode(['details' => $details]),
                'performed_by' => auth()->id(),
                'created_at'   => now(),
            ]);
        } catch (Throwable) {
        }
    }
}
