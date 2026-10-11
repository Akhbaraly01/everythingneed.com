<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\OrderQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Requests\AdminRefundOrderRequest;
use Modules\Admin\Http\Requests\AdminUpdateOrderStatusRequest;

/**
 * AdminOrderController — Order management endpoints for the admin panel.
 */
class AdminOrderController extends Controller
{
    /**
     * Every status that exists on vendor_orders (matches the DB CHECK
     * constraint) — used for list filtering.
     */
    public const ORDER_STATUSES = [
        'pending', 'paid', 'confirmed', 'processing',
        'shipped', 'delivered', 'completed', 'cancelled', 'refunded',
    ];

    /**
     * Statuses an admin may set through the API. Excludes 'paid': payment
     * state changes come from the payment provider/webhook, never from a
     * browser-driven status update.
     */
    public const VALID_STATUSES = [
        'pending', 'confirmed', 'processing', 'shipped',
        'delivered', 'completed', 'cancelled', 'refunded',
    ];

    public function __construct(
        private OrderQueryInterface $orders,
        private \Core\Services\Contracts\ScopeResolverInterface $scopes,
    ) {}

    /**
     * Server-side row scope for the orders console (W1.6).
     */
    private function scopeFor(Request $request): \Core\DTOs\ScopeContext
    {
        return $this->scopes->contextFor($request->user(), 'orders.orders.view');
    }

    /**
     * Paginated list of all orders with filters.
     *
     * GET /api/admin/orders
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'     => ['nullable', 'string', 'max:100'],
            'status'     => ['nullable', 'string', 'in:' . implode(',', self::ORDER_STATUSES)],
            'vendor_id'  => ['nullable', 'string'],
            'date_from'  => ['nullable', 'date'],
            'date_to'    => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page'   => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'       => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['scope_context'] = $this->scopeFor($request);

        return response()->json($this->orders->paginate($validated));
    }

    /**
     * Returns full order detail (404 for rows outside the caller's scope).
     *
     * GET /api/admin/orders/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = $this->orders->find($id, $this->scopeFor($request));

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json(['data' => $order]);
    }

    /**
     * Updates order status (state-machine guarded: forward-only, terminal
     * states are final; same-state updates are idempotent).
     *
     * PUT /api/admin/orders/{id}/status
     */
    public function updateStatus(AdminUpdateOrderStatusRequest $request, string $id): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->orders->updateStatus(
            $id,
            $validated['status'],
            $validated['reason'] ?? null,
            $this->scopeFor($request),
        );

        return match ($result) {
            'missing' => response()->json(['message' => 'Order not found'], 404),
            'invalid_transition' => response()->json(['message' => 'Invalid status transition'], 422),
            default => response()->json(['message' => 'Order status updated']),
        };
    }

    /**
     * Issues a refund for a completed order.
     *
     * POST /api/admin/orders/{id}/refund
     */
    public function refund(AdminRefundOrderRequest $request, string $id): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->orders->refund($id, $validated['reason'] ?? null, $this->scopeFor($request));

        return match ($result) {
            'missing' => response()->json(['message' => 'Order not found'], 404),
            'already_refunded' => response()->json(['message' => 'Order already refunded'], 422),
            'not_refundable' => response()->json(['message' => 'Refund not allowed for this order status'], 422),
            default => response()->json(['message' => 'Refund issued successfully']),
        };
    }
}
