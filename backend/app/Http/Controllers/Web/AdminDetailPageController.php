<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\OrderQueryInterface;
use Core\Services\Contracts\ScopeResolverInterface;
use Core\Services\Contracts\UserAdminInterface;
use Core\Services\Contracts\VendorQueryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Server-rendered admin detail pages (W3): orders, vendors, users, payouts.
 *
 * Every page resolves its subject through the same service contracts as its
 * JSON counterpart (scope-aware for orders), so web and API cannot drift.
 * Missing ids and out-of-scope rows both abort(404); bootstrap/app.php
 * renders that for web requests as the app-wide non-leaking not-found
 * redirect, so the two cases stay indistinguishable.
 */
class AdminDetailPageController extends Controller
{
    public function __construct(
        private OrderQueryInterface $orders,
        private UserAdminInterface $users,
        private VendorQueryInterface $vendors,
        private ScopeResolverInterface $scopes,
    ) {}

    /**
     * GET /admin/orders/{id}
     */
    public function order(Request $request, string $id): Response
    {
        $scope = $this->scopes->contextFor($request->user(), 'orders.orders.view');
        $order = $this->orders->find($id, $scope);

        if (! $order) {
            abort(404);
        }

        // A vendor_orders row is one product line; multi-item carts keep their
        // full list in order_items (via order_id) and payments may attach to
        // either id depending on the checkout flow — so both are matched.
        $orderIds = array_values(array_filter([$order->id, $order->order_id ?? null]));

        $items = ! empty($order->order_id)
            ? DB::table('order_items')
                ->where('order_id', $order->order_id)
                ->whereNull('deleted_at')
                ->get()
            : collect();

        $payments = DB::table('payments')
            ->whereIn('order_id', $orderIds)
            ->orderByDesc('created_at')
            // Ciphertext never ships to clients: gateway_response/metadata
            // stay server-side (decryptable only through the model casts).
            ->select(['id', 'order_id', 'user_id', 'amount', 'currency', 'status', 'method', 'reference', 'purpose', 'idempotency_key', 'provider', 'provider_payment_id', 'created_at', 'updated_at'])
            ->get();

        $refunds = DB::table('refunds')
            ->join('payments', 'payments.id', '=', 'refunds.payment_id')
            ->whereIn('payments.order_id', $orderIds)
            ->orderByDesc('refunds.created_at')
            ->select(['refunds.id', 'refunds.payment_id', 'refunds.amount', 'refunds.reason', 'refunds.status', 'refunds.method', 'refunds.requested_by', 'refunds.reviewed_by', 'refunds.requested_at', 'refunds.reviewed_at', 'refunds.rejection_reason', 'refunds.cancellation_id', 'refunds.created_at', 'refunds.updated_at'])
            ->get();

        return Inertia::render('admin/OrderDetail', [
            'order' => $order,
            'items' => $items,
            'payments' => $payments,
            'refunds' => $refunds,
        ]);
    }

    /**
     * GET /admin/vendors/{id}
     */
    public function vendor(string $id): Response
    {
        $vendor = $this->vendors->find($id);

        if (! $vendor) {
            abort(404);
        }

        // Stats use the exact same formulas as VendorQueryService::paginate()
        // so the detail page can never disagree with the list it came from.
        $stats = [
            'products' => (int) DB::table('products')->where('vendor_id', $id)->count(),
            'orders' => (int) DB::table('vendor_orders')->where('vendor_id', $id)->count(),
            'revenue' => (float) DB::table('vendor_orders')->where('vendor_id', $id)->sum('total_price'),
            'pending_withdrawals' => (int) DB::table('vendor_withdrawals')
                ->where('vendor_id', $id)->whereNull('deleted_at')->where('status', 'pending')->count(),
            'pending_withdrawal_amount' => (float) DB::table('vendor_withdrawals')
                ->where('vendor_id', $id)->whereNull('deleted_at')->where('status', 'pending')->sum('amount'),
        ];

        $owner = ! empty($vendor->user_id) ? $this->users->find($vendor->user_id) : null;

        $recentProducts = DB::table('products')
            ->where('vendor_id', $id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->select('id', 'name', 'price', 'stock_quantity', 'is_active', 'created_at')
            ->get();

        $recentOrders = DB::table('vendor_orders as o')
            ->leftJoin('users as u', 'u.id', '=', 'o.customer_id')
            ->where('o.vendor_id', $id)
            ->whereNull('o.deleted_at')
            ->orderByDesc('o.created_at')
            ->limit(5)
            ->select('o.id', 'o.order_number', 'o.total_price', 'o.status', 'o.created_at', 'u.name as customer_name')
            ->get();

        $withdrawals = DB::table('vendor_withdrawals')
            ->where('vendor_id', $id)
            ->whereNull('deleted_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('admin/VendorDetail', [
            'vendor' => $vendor,
            'owner' => $owner,
            'stats' => $stats,
            'recentProducts' => $recentProducts,
            'recentOrders' => $recentOrders,
            'withdrawals' => $withdrawals,
        ]);
    }

    /**
     * GET /admin/users/{id}
     */
    public function user(string $id): Response
    {
        $user = $this->users->find($id);

        if (! $user) {
            abort(404);
        }

        $roles = DB::table('user_roles')->where('user_id', $id)->pluck('role');
        $grants = DB::table('user_permissions')
            ->where('user_id', $id)
            ->orderByDesc('created_at')
            ->get(['permission', 'state', 'note', 'granted_by', 'created_at']);
        $vendor = DB::table('vendors')
            ->where('user_id', $id)
            ->whereNull('deleted_at')
            ->first();

        $stats = [
            'orders' => (int) DB::table('vendor_orders')
                ->where('customer_id', $id)->whereNull('deleted_at')->count(),
            'tickets' => (int) DB::table('tickets')
                ->where('user_id', $id)->count(),
        ];

        return Inertia::render('admin/UserDetail', [
            'user' => $user,
            'roles' => $roles,
            'grants' => $grants,
            'vendor' => $vendor,
            'stats' => $stats,
        ]);
    }

    /**
     * GET /admin/payouts/{id}
     */
    public function payout(string $id): Response
    {
        $withdrawal = $this->vendors->findWithdrawal($id);

        if (! $withdrawal) {
            abort(404);
        }

        $vendor = $this->vendors->find($withdrawal->vendor_id);

        $recentWithdrawals = DB::table('vendor_withdrawals')
            ->where('vendor_id', $withdrawal->vendor_id)
            ->whereNull('deleted_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $commissionTotals = DB::table('vendor_commissions')
            ->where('vendor_id', $withdrawal->vendor_id)
            ->whereNull('deleted_at')
            ->groupBy('status')
            ->select('status', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->get();

        $recentCommissions = DB::table('vendor_commissions')
            ->where('vendor_id', $withdrawal->vendor_id)
            ->whereNull('deleted_at')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        return Inertia::render('admin/PayoutDetail', [
            'withdrawal' => $withdrawal,
            'vendor' => $vendor,
            'recentWithdrawals' => $recentWithdrawals,
            'commissionTotals' => $commissionTotals,
            'recentCommissions' => $recentCommissions,
        ]);
    }
}
