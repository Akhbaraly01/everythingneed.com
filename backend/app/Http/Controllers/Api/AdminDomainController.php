<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Domain consoles: one admin read/update surface per remaining real table
 * (pharmacy orders, building bookings, disputes, refunds, subscriptions,
 * wallet transactions, notifications, properties). Each route is role-gated
 * in Modules/Admin/Routes/api.php; scoping is fail-closed (explicit joins).
 */
class AdminDomainController extends Controller
{
    /** Pharmacy: every medicine order with buyer (own-orders endpoint is scoped). */
    public function pharmacyOrders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,pending,confirmed,processing,shipped,delivered,cancelled'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('medicine_orders as mo')
            ->leftJoin('users as u', 'u.id', '=', 'mo.user_id')
            ->select([
                'mo.id', 'mo.order_number', 'mo.status', 'mo.total_amount', 'mo.prescription_url',
                'mo.prescription_id', 'mo.delivery_address', 'mo.created_at',
                'u.name as buyer_name', 'u.email as buyer_email',
                DB::raw('(select count(*) from medicine_order_items i where i.order_id = mo.id) as items_count'),
            ])
            ->whereNull('mo.deleted_at')
            ->orderByDesc('mo.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('mo.order_number', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('mo.status', $status);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Building services: every booking with requester. */
    public function buildingBookings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,pending,confirmed,in_progress,completed,cancelled,rejected'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('building_service_bookings as b')
            ->leftJoin('users as u', 'u.id', '=', 'b.user_id')
            ->select([
                'b.id', 'b.worker_type', 'b.service_category', 'b.description', 'b.address',
                'b.scheduled_date', 'b.scheduled_time', 'b.estimated_cost', 'b.status', 'b.created_at',
                'u.name as requester_name', 'u.email as requester_email',
            ])
            ->whereNull('b.deleted_at')
            ->orderByDesc('b.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('b.worker_type', 'ilike', "%{$search}%")
                    ->orWhere('b.service_category', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('b.status', $status);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Returns & disputes: every dispute with requester + order. */
    public function disputes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,open,in_review,resolved,closed'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('disputes as d')
            ->leftJoin('users as u', 'u.id', '=', 'd.user_id')
            ->leftJoin('vendor_orders as o', 'o.id', '=', 'd.order_id')
            ->select([
                'd.id', 'd.subject', 'd.description', 'd.status', 'd.resolution', 'd.resolution_notes',
                'd.order_id', 'd.created_at',
                'u.name as requester_name', 'u.email as requester_email',
                'o.order_number',
            ])
            ->whereNull('d.deleted_at')
            ->orderByDesc('d.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('d.subject', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%")
                    ->orWhere('o.order_number', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('d.status', $status);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Dispute decision (status + resolution + notes), audited. */
    public function updateDispute(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status'          => ['required', 'string', 'in:open,in_review,resolved,closed'],
            'resolution'      => ['nullable', 'string', 'in:none,refund,replacement,credit,dismissed'],
            'resolution_notes'=> ['nullable', 'string', 'max:2000'],
        ]);

        $dispute = DB::table('disputes')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $payload = ['status' => $validated['status'], 'updated_at' => now()];
        if (array_key_exists('resolution', $validated) && $validated['resolution'] !== null) {
            $payload['resolution'] = $validated['resolution'];
        }
        if (array_key_exists('resolution_notes', $validated)) {
            $payload['resolution_notes'] = $validated['resolution_notes'];
        }

        DB::table('disputes')->where('id', $id)->update($payload);

        // Spec §32: a dispute that stops being open hands the order back to
        // its interrupted status - except a refund resolution, which keeps it
        // disputed until the gateway refund marks it refunded.
        $stopsBeingOpen = in_array($validated['status'], ['resolved', 'closed'], true);
        $refundResolution = ($payload['resolution'] ?? $dispute->resolution) === 'refund';

        if ($stopsBeingOpen && ! $refundResolution && $dispute->order_id && $dispute->previous_status) {
            $order = \Modules\Orders\Entities\Order::find($dispute->order_id);

            if ($order && $order->status === \Modules\Orders\Entities\Order::STATUS_DISPUTED) {
                $order->update(['status' => $dispute->previous_status]);

                \Modules\Orders\Entities\OrderTracking::create([
                    'order_id' => $order->id,
                    'order_type' => 'product',
                    'user_id' => $order->user_id,
                    'status' => $dispute->previous_status,
                    'status_message' => 'Dispute resolved - order resumed',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'dispute.'.$validated['status'],
                'entity_type' => 'dispute',
                'entity_id' => $id,
                'performed_by' => $request->user()->id,
                'old_values' => ['status' => $dispute->status, 'resolution' => $dispute->resolution],
                'new_values' => ['status' => $validated['status'], 'resolution' => $payload['resolution'] ?? $dispute->resolution],
            ]);
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Dispute updated']);
    }

    /** Refunds with payment context. */
    public function refunds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,pending,approved,rejected,completed,succeeded,failed'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('refunds as r')
            ->join('payments as p', 'p.id', '=', 'r.payment_id')
            ->leftJoin('users as ru', 'ru.id', '=', 'r.requested_by')
            ->leftJoin('users as vu', 'vu.id', '=', 'r.reviewed_by')
            ->select([
                'r.id', 'r.amount', 'r.reason', 'r.status', 'r.created_at',
                'r.method as refund_method', 'r.requested_at', 'r.reviewed_at',
                'r.rejection_reason', 'r.cancellation_id',
                'p.reference', 'p.method', 'p.status as payment_status', 'p.amount as payment_amount',
                'ru.name as requested_by_name', 'vu.name as reviewed_by_name',
            ])
            ->whereNull('r.deleted_at')
            ->orderByDesc('r.created_at');

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('r.status', $status);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /**
     * Gap 3 support review: approve a pending refund REQUEST (money then
     * moves same-method) or reject it with a reason. Non-pending rows are 422.
     */
    public function decideRefund(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:500'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        try {
            $refund = app(\Modules\Payments\Actions\ReviewRefund::class)->execute(
                $id,
                $request->user()->id,
                $validated['action'],
                $validated['reason'] ?? null,
                isset($validated['amount']) ? (float) $validated['amount'] : null,
            );
        } catch (\Core\Exceptions\NotFoundException $e) {
            return response()->json(['message' => 'Refund request not found'], 404);
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $validated['action'] === 'approve'
                ? 'Refund approved and processed'
                : 'Refund request rejected',
            'data' => $refund,
        ]);
    }

    /** Subscriptions with user + plan. */
    public function subscriptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,active,cancelled,expired,paused'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('subscriptions as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->leftJoin('plans as pl', 'pl.id', '=', 's.plan_id')
            ->select([
                's.id', 's.status', 's.starts_at', 's.ends_at', 's.cancelled_at', 's.created_at',
                'u.name as user_name', 'u.email as user_email',
                'pl.name as plan_name', 'pl.price as plan_price',
            ])
            ->whereNull('s.deleted_at')
            ->orderByDesc('s.created_at');

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('s.status', $status);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Platform wallet ledger (all wallets). */
    public function walletTransactions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'   => ['nullable', 'string', 'in:all,credit,debit'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('wallet_transactions as wt')
            ->join('wallets as w', 'w.id', '=', 'wt.wallet_id')
            ->join('users as u', 'u.id', '=', 'w.user_id')
            ->select([
                'wt.id', 'wt.type', 'wt.amount', 'wt.balance_after', 'wt.reference', 'wt.description', 'wt.created_at',
                'u.name as user_name', 'u.email as user_email', 'w.currency', 'w.balance as wallet_balance',
            ])
            ->orderByDesc('wt.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('u.name', 'ilike', "%{$search}%")
                    ->orWhere('u.email', 'ilike', "%{$search}%")
                    ->orWhere('wt.reference', 'ilike', "%{$search}%");
            });
        }

        $type = $validated['type'] ?? 'all';
        if ($type !== '' && $type !== 'all') {
            $query->where('wt.type', $type);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Recent platform notifications across users (read-only). */
    public function notifications(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_read' => ['nullable', 'string', 'in:all,read,unread'],
            'type'    => ['nullable', 'string', 'max:60'],
            'page'    => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('notifications as n')
            ->leftJoin('users as u', 'u.id', '=', 'n.user_id')
            ->select([
                'n.id', 'n.title', 'n.message', 'n.type', 'n.is_read', 'n.created_at',
                'u.name as user_name', 'u.email as user_email',
            ])
            ->whereNull('n.deleted_at')
            ->orderByDesc('n.created_at');

        if (is_string($validated['type'] ?? null) && $validated['type'] !== '') {
            $query->where('n.type', $validated['type']);
        }

        $read = $validated['is_read'] ?? 'all';
        if ($read === 'read') {
            $query->where('n.is_read', true);
        } elseif ($read === 'unread') {
            $query->where('n.is_read', false);
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    /** Properties incl. inactive (public index hides them) + owner. */
    public function properties(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,active,inactive'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('properties as pr')
            ->leftJoin('users as u', 'u.id', '=', 'pr.user_id')
            ->select([
                'pr.id', 'pr.title', 'pr.property_type', 'pr.price', 'pr.currency', 'pr.city', 'pr.country',
                'pr.bedrooms', 'pr.bathrooms', 'pr.is_active', 'pr.is_featured', 'pr.created_at',
                'u.name as owner_name', 'u.email as owner_email',
            ])
            ->whereNull('pr.deleted_at')
            ->orderByDesc('pr.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('pr.title', 'ilike', "%{$search}%")
                    ->orWhere('pr.city', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('pr.is_active', $status === 'active');
        }

        return $this->paginate($query, $validated['page'] ?? 1, 15);
    }

    public function updateProperty(Request $request, string $id): JsonResponse
    {
        $request->validate(['is_active' => 'required|boolean']);

        $exists = DB::table('properties')->where('id', $id)->whereNull('deleted_at')->exists();
        if (!$exists) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        DB::table('properties')->where('id', $id)->update([
            'is_active' => $request->boolean('is_active'),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Property updated']);
    }

    /** Admin moderation delete (owner-only endpoint cannot serve moderators). */
    public function destroyReview(Request $request, string $id): JsonResponse
    {
        $review = DB::table('reviews')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        DB::table('reviews')->where('id', $id)->update(['deleted_at' => now()]);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'review.deleted',
                'entity_type' => 'review',
                'entity_id' => $id,
                'performed_by' => $request->user()->id,
                'old_values' => ['rating' => $review->rating, 'user_id' => $review->user_id],
            ]);
        } catch (\Throwable) {
        }

        return response()->json(['message' => 'Review deleted']);
    }

    /** Shared paginator → {data, total, meta}. */
    private function paginate($query, int $page, int $perPage): JsonResponse
    {
        $total = (clone $query)->count();
        $rows = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => $perPage, 'total' => $total],
        ]);
    }
}
