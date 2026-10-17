<?php

namespace Core\Services;

use App\Models\User;
use App\Models\Wallet;
use Core\Services\Contracts\ReportingServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Orders\Entities\VendorOrder;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Modules\Analytics\Entities\AnalyticsEvent;

class ReportingService extends BaseService implements ReportingServiceInterface
{
    public function getDashboardStats(string $userId, ?string $role = null): array
    {
        $user = User::findOrFail($userId);

        if ($role === 'admin') {
            return $this->getAdminStats();
        }

        if ($role === 'vendor') {
            return $this->getVendorStats($userId);
        }

        return $this->getUserStats($userId);
    }

    public function getSalesReport(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['end_date'] ?? now()->endOfDay();
        $vendorId = $filters['vendor_id'] ?? null;

        $query = VendorOrder::whereBetween('created_at', [$startDate, $endDate]);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        $orders = $query->get();

        $totalRevenue = $orders->sum('total_price');
        $totalOrders = $orders->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;

        $dailyBreakdown = $orders->groupBy(function ($order) {
            return $order->created_at->format('Y-m-d');
        })->map(function ($dayOrders) {
            return [
                'revenue' => round($dayOrders->sum('total_price'), 2),
                'orders' => $dayOrders->count(),
            ];
        });

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_revenue' => round($totalRevenue, 2),
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
            'daily_breakdown' => $dailyBreakdown,
        ];
    }

    public function getAnalyticsReport(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['end_date'] ?? now()->endOfDay();
        $eventType = $filters['event_type'] ?? null;

        $query = AnalyticsEvent::whereBetween('created_at', [$startDate, $endDate]);

        if ($eventType) {
            $query->where('event_type', $eventType);
        }

        $events = $query->get();

        $eventBreakdown = $events->groupBy('event_type')->map(function ($group) {
            return $group->count();
        });

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_events' => $events->count(),
            'event_breakdown' => $eventBreakdown,
            'unique_users' => $events->pluck('user_id')->unique()->count(),
        ];
    }

    private function getAdminStats(): array
    {
        return [
            'total_users' => User::count(),
            'total_vendors' => Vendor::count(),
            'total_products' => Product::count(),
            'total_orders' => VendorOrder::count(),
            'total_revenue' => round(VendorOrder::sum('total_price'), 2),
            'recent_orders' => VendorOrder::latest()->take(10)->get(),
        ];
    }

    private function getVendorStats(string $vendorId): array
    {
        $vendor = Vendor::where('user_id', $vendorId)->first();

        $orders = VendorOrder::where('vendor_id', $vendor->id ?? null)->get();

        return [
            'vendor_id' => $vendorId,
            'total_orders' => $orders->count(),
            'total_revenue' => round($orders->sum('total_price'), 2),
            'total_products' => Product::where('vendor_id', $vendor->id ?? null)->count(),
            'pending_orders' => $orders->where('status', 'pending')->count(),
        ];
    }

    private function getUserStats(string $userId): array
    {
        $wallet = Wallet::where('user_id', $userId)->first();

        return [
            'user_id' => $userId,
            'wallet_balance' => $wallet ? (float) $wallet->balance : 0,
            'total_orders' => VendorOrder::where('customer_id', $userId)->count(),
        ];
    }

    public function adminDashboardStats(): array
    {
        return [
            'users' => [
                'total'      => DB::table('users')->whereNull('deleted_at')->count(),
                'this_month' => DB::table('users')
                    ->whereNull('deleted_at')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'active'     => DB::table('users')
                    ->whereNull('deleted_at')
                    ->whereNull('suspended_at')
                    ->count(),
            ],
            'vendors' => [
                'total'    => DB::table('vendors')->whereNull('deleted_at')->count(),
                'pending'  => DB::table('vendors')->whereNull('deleted_at')->where('is_verified', false)->count(),
                'verified' => DB::table('vendors')->whereNull('deleted_at')->where('is_verified', true)->count(),
            ],
            'orders' => [
                'total'     => DB::table('vendor_orders')->whereNull('deleted_at')->count(),
                'pending'   => DB::table('vendor_orders')->whereNull('deleted_at')->where('status', 'pending')->count(),
                'completed' => DB::table('vendor_orders')->whereNull('deleted_at')->where('status', 'completed')->count(),
                'cancelled' => DB::table('vendor_orders')->whereNull('deleted_at')->where('status', 'cancelled')->count(),
            ],
            'tickets' => [
                'open'     => DB::table('tickets')->where('status', 'open')->count(),
                'total'    => DB::table('tickets')->count(),
                'resolved' => DB::table('tickets')->where('status', 'resolved')->count(),
            ],
            'healthcare' => [
                'doctors'      => DB::table('doctors')->whereNull('deleted_at')->count(),
                'appointments' => DB::table('health_tickets')->whereNull('deleted_at')->count(),
            ],
            'learn' => [
                'courses' => DB::table('learn_posts')->whereNull('deleted_at')->count(),
                'pending' => DB::table('learn_posts')->whereNull('deleted_at')->where('status', 'pending')->count(),
            ],
        ];
    }

    /**
     * Windowed overview cards for /admin/analytics. The selected range
     * (7d|30d|90d) windows the flow metrics (new users, orders, revenue);
     * stock gauges (verified vendors, total users) stay all-time and are
     * labelled as such in the UI.
     */
    public function adminOverview(string $range): array
    {
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };
        $since = now()->subDays($days)->startOfDay();

        return [
            'range'  => $days.'d',
            'since'  => $since->toDateString(),
            // Windowed — reacts to the selected range.
            'new_users'    => (int) DB::table('users')
                ->whereNull('deleted_at')
                ->where('created_at', '>=', $since)
                ->count(),
            'total_orders' => (int) DB::table('vendor_orders')
                ->where('created_at', '>=', $since)
                ->count(),
            'total_revenue'=> (float) (DB::table('payments')
                ->where('status', 'succeeded')
                ->where('created_at', '>=', $since)
                ->sum('amount') ?? 0),
            // Stock gauges — unaffected by the window.
            'active_vendors' => (int) DB::table('vendors')
                ->whereNull('deleted_at')
                ->where('is_verified', true)
                ->count(),
            'total_users'   => (int) DB::table('users')
                ->whereNull('deleted_at')
                ->count(),
        ];
    }

    public function adminAnalyticsSeries(string $metric, \DateTimeInterface $since): array
    {
        return match ($metric) {
            // ->all(): the contract is array — returning the Collection
            // raised a TypeError (every series endpoint answered 500).
            'users' => DB::table('users')
                ->select(DB::raw('DATE(created_at) as label'), DB::raw('COUNT(*) as value'))
                ->where('created_at', '>=', $since)
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('label')
                ->get()
                ->all(),
            'revenue' => DB::table('payments')
                ->select(DB::raw('DATE(created_at) as label'), DB::raw('SUM(amount) as value'))
                ->where('status', 'succeeded')
                ->where('created_at', '>=', $since)
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('label')
                ->get()
                ->all(),
            'traffic', 'activity' => DB::table('audit_logs')
                ->select(DB::raw('DATE(created_at) as label'), DB::raw('COUNT(*) as value'))
                ->where('created_at', '>=', $since)
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('label')
                ->get()
                ->all(),
            // Spec §63 domain series — real rows only; a missing table or an
            // empty window yields [] so the UI can show an explicit empty
            // state (never fabricated points).
            'orders' => $this->dailySeries('vendor_orders', $since),
            'bookings' => $this->dailySeries('bookings', $since),
            'healthcare' => $this->dailySeries('health_tickets', $since),
            'learning' => $this->dailySeries('enrollments', $since, null, 'last_active_at'),
            'needs' => $this->dailySeries('need_requests', $since),
            'services' => $this->dailySeries('vendor_services', $since),
            'wallet' => $this->dailySeries('wallet_transactions', $since),
            'payments' => $this->dailySeries('payments', $since, ['succeeded']),
            default => [],
        };
    }

    /**
     * Spec §63 conversion funnel: signups → orders → succeeded payments for
     * the window. Rates are null (not 0) when the denominator is zero so the
     * UI never invents a percentage.
     */
    public function adminConversionFunnel(\DateTimeInterface $since): array
    {
        $signedUp = Schema::hasTable('users')
            ? (int) DB::table('users')->whereNull('deleted_at')->where('created_at', '>=', $since)->count()
            : 0;
        $ordered = Schema::hasTable('vendor_orders')
            ? (int) DB::table('vendor_orders')->where('created_at', '>=', $since)->count()
            : 0;
        $paid = Schema::hasTable('payments')
            ? (int) DB::table('payments')->where('status', 'succeeded')->where('created_at', '>=', $since)->count()
            : 0;

        return [
            'since' => $since->format('Y-m-d'),
            'steps' => [
                ['label' => 'Signed up', 'value' => $signedUp],
                ['label' => 'Orders created', 'value' => $ordered],
                ['label' => 'Payments succeeded', 'value' => $paid],
            ],
            'signup_to_order_rate' => $signedUp > 0 ? round($ordered / $signedUp * 100, 1) : null,
            'order_to_paid_rate' => $ordered > 0 ? round($paid / $ordered * 100, 1) : null,
        ];
    }

    /** Daily count (or aggregate) rows for a domain table since $since. */
    private function dailySeries(string $table, \DateTimeInterface $since, ?array $statuses = null, string $timeColumn = 'created_at'): array
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $timeColumn)) {
            return [];
        }

        $query = DB::table($table)->where($timeColumn, '>=', $since);
        if ($statuses !== null) {
            $query->whereIn('status', $statuses);
        }

        return $query
            ->select(DB::raw("DATE({$timeColumn}) as label"), DB::raw('COUNT(*) as value'))
            ->groupBy(DB::raw("DATE({$timeColumn})"))
            ->orderBy('label')
            ->get()
            ->all();
    }

    public function productCategoryBreakdown(): array
    {
        return DB::table('products')
            ->select('category as label', DB::raw('COUNT(*) as value'))
            ->whereNotNull('category')
            ->where('is_active', true)
            ->groupBy('category')
            ->orderByDesc('value')
            ->limit(10)
            ->get()
            ->all();
    }

    public function financeSummary(): array
    {
        // Canonical payment status is 'succeeded' (legacy 'completed' kept for old rows).
        $revenueByMonth = DB::table('payments')
            ->selectRaw("to_char(created_at, 'YYYY-MM') as month")
            ->selectRaw('SUM(amount) as revenue')
            ->selectRaw('COUNT(*) as orders')
            ->whereIn('status', ['succeeded', 'completed'])
            ->groupByRaw("to_char(created_at, 'YYYY-MM')")
            ->orderByDesc('month')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'month'   => $row->month,
                'revenue' => (float) $row->revenue,
                'orders'  => (int) $row->orders,
            ])
            ->values();

        return [
            'total_revenue' => (float) (DB::table('payments')
                ->whereIn('status', ['succeeded', 'completed'])
                ->sum('amount') ?? 0),
            'total_commissions'     => (float) (DB::table('vendor_commissions')->sum('amount') ?? 0),
            'pending_payouts'       => (float) (DB::table('vendor_withdrawals')->where('status', 'pending')->sum('amount') ?? 0),
            'active_subscriptions'  => (int) DB::table('subscriptions')->where('status', 'active')->count(),
            'revenue_by_month'      => $revenueByMonth,
        ];
    }

    public function paymentTransactions(array $filters = []): array
    {
        // Ciphertext never ships to clients: gateway_response/metadata stay
        // server-side (decryptable only through the model casts).
        $query = DB::table('payments')
            ->select(['id', 'order_id', 'user_id', 'amount', 'currency', 'status', 'method', 'reference', 'purpose', 'idempotency_key', 'provider', 'provider_payment_id', 'created_at', 'updated_at'])
            ->orderByDesc('created_at');

        // Real columns only: payments has method + status, no `type`.
        if (is_string($filters['method'] ?? null) && $filters['method'] !== '') {
            $query->where('method', $filters['method']);
        }
        if (is_string($filters['status'] ?? null) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        $total = (clone $query)->count();
        $page  = (int) ($filters['page'] ?? 1);
        $rows  = $query->offset(($page - 1) * 15)->limit(15)->get();

        return ['data' => $rows, 'total' => $total];
    }

    public function userStats(string $userId): array
    {
        $safeCount = function (string $table, string $column = 'user_id') use ($userId): int {
            try {
                if (! \Illuminate\Support\Facades\Schema::hasTable($table)) {
                    return 0;
                }

                return (int) DB::table($table)->where($column, $userId)->count();
            } catch (\Throwable) {
                return 0;
            }
        };

        $walletBalance = 0;
        try {
            $wallet = DB::table('wallets')->where('user_id', $userId)->first();
            $walletBalance = (float) ($wallet->balance ?? 0);
        } catch (\Throwable) {
        }

        $recentOrders = [];
        $ordersCount = 0;
        $totalSpent = 0.0;
        $ordersByMonth = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('orders')) {
                $base = DB::table('orders')
                    ->where('user_id', $userId)
                    ->whereNull('deleted_at');

                $ordersCount = (clone $base)->count();

                // Cancelled/refunded orders were not (net) spent.
                $totalSpent = round((float) (clone $base)
                    ->whereNotIn('status', ['cancelled', 'refunded'])
                    ->sum('total_amount'), 2);

                $ordersByMonth = (clone $base)
                    ->selectRaw("to_char(created_at, 'YYYY-MM') as month")
                    ->selectRaw('COUNT(*) as count')
                    ->selectRaw("SUM(CASE WHEN status NOT IN ('cancelled', 'refunded') THEN total_amount ELSE 0 END) as net")
                    ->groupByRaw("to_char(created_at, 'YYYY-MM')")
                    ->orderBy('month')
                    ->get()
                    ->map(fn ($row) => [
                        'month' => $row->month,
                        'count' => (int) $row->count,
                        'total' => round((float) $row->net, 2),
                    ])
                    ->all();

                $recentOrders = DB::table('orders')
                    ->where('user_id', $userId)
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get(['id', 'total_amount', 'status', 'created_at'])
                    ->map(fn ($o) => [
                        'id'         => $o->id,
                        'reference'  => $o->id,
                        'total'      => (float) ($o->total_amount ?? 0),
                        'status'     => $o->status ?? 'pending',
                        'created_at' => $o->created_at,
                    ])
                    ->all();
            }
        } catch (\Throwable) {
        }

        return [
            'orders_count'       => $safeCount('orders'),
            'total_orders'       => $ordersCount,
            'total_spent'        => $totalSpent,
            'orders_by_month'    => $ordersByMonth,
            'wishlist_count'     => $safeCount('wishlists'),
            'wallet_balance'     => $walletBalance,
            'certificates_count' => $safeCount('user_certificates'),
            'enrolled_courses'   => $safeCount('enrollments'),
            'addresses_count'    => $safeCount('addresses'),
            'recent_orders'      => $recentOrders,
        ];
    }
}
