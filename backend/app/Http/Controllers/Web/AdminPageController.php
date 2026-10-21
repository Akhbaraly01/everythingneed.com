<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Core\Enums\AppRole;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\Contracts\WorkspaceResolverInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminPageController extends Controller
{
    public function __construct(
        private PermissionServiceInterface $permissions,
        private WorkspaceResolverInterface $workspace,
        private \Core\Services\Contracts\ApprovalEngineInterface $approvals,
    ) {}

    /**
     * Server-side category scope for marketplace_admin (never taken from the
     * browser). Resolution lives in Core\Services\PermissionService so the
     * web queue and the API approval endpoints cannot drift apart.
     */
    private function productCategoryScope(Request $request): ?string
    {
        $user = $request->user();

        if (! $user) {
            return '__no_category_assigned__';
        }

        return $this->permissions->productCategoryScope($user->id);
    }

    public function approvals(Request $request): Response
    {
        $scope = $this->productCategoryScope($request);

        $pending = DB::table('products')
            ->leftJoin('vendors', 'vendors.id', '=', 'products.vendor_id')
            ->whereNull('products.approved_at')
            ->when($scope !== null, fn ($q) => $q->where('products.category', $scope))
            ->orderBy('products.created_at')
            ->select(
                'products.id',
                'products.name',
                'products.category',
                'products.price',
                'products.stock_quantity',
                'products.created_at',
                'vendors.store_name as vendor_name',
            )
            ->limit(100)
            ->get();

        $recentDecisions = DB::table('rejected_products')
            ->join('products', 'products.id', '=', 'rejected_products.product_id')
            ->when($scope !== null, fn ($q) => $q->where('products.category', $scope))
            ->orderByDesc('rejected_products.created_at')
            ->limit(15)
           ->select(
                'rejected_products.id',
                'products.name as product_name',
                'rejected_products.reason',
                'rejected_products.created_at',
            )
            ->get();

        return Inertia::render('admin/Approvals', [
            'pending' => $pending,
            'recentDecisions' => $recentDecisions,
            'requests' => $this->approvals->list(['status' => 'pending', 'per_page' => 20])['data'],
        ]);
    }

    public function departments(): Response
    {
        $departments = DB::table('departments')
            ->leftJoin('tickets', 'tickets.department_id', '=', 'departments.id')
            ->select(
                'departments.id',
                'departments.name',
                'departments.description',
                'departments.created_at',
                DB::raw('count(tickets.id) as tickets_count'),
            )
            ->groupBy('departments.id')
            ->orderBy('departments.name')
            ->get();

        return Inertia::render('admin/Departments', [
            'departments' => $departments,
        ]);
    }

    public function rbac(): Response
    {
        // Matrix is fetched client-side (super-admin-gated API) so the page
        // stays in sync after every grant/revoke without a full reload.
        return Inertia::render('admin/Rbac', [
            'catalog' => \Database\Seeders\PermissionSeeder::CATALOG,
        ]);
    }

    public function categories(Request $request): Response
    {
        // Scoped marketplace admins see only their own subtree (master-plan
        // T); unassigned scopes fail closed to an empty list.
        $scope = $this->permissions->managedCategoryId($request->user()->id);
        $ids = $scope === null ? null : $this->subtreeIds($scope);

        $categories = DB::table('categories')
            ->when($ids !== null, fn ($q) => $q->whereIn('id', $ids))
            ->select([
                'id', 'name', 'slug', 'description', 'parent_id', 'icon', 'image_url',
                'meta_title', 'meta_description', 'meta_keywords',
                'sort_order', 'is_active', 'created_at',
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/Categories', [
            'categories' => $categories,
        ]);
    }

    /** Scope root + all descendants (empty when the sentinel denies). */
    private function subtreeIds(?string $scopeRootId): array
    {
        if ($scopeRootId === '__no_category_assigned__') {
            return [];
        }

        $ids = [(string) $scopeRootId];
        $frontier = [(string) $scopeRootId];
        $guard = 0;
        while ($frontier !== [] && $guard++ < 100) {
            $children = DB::table('categories')->whereIn('parent_id', $frontier)->pluck('id')->all();
            $children = array_map('strval', $children);
            $children = array_diff($children, $ids);
            $ids = array_merge($ids, $children);
            $frontier = array_values($children);
        }

        return array_values($ids);
    }

    /**
     * Administration dashboard: role-filtered metric cards computed
     * server-side from real tables (zeros are real zeros — no fake data).
     * Access is enforced by the role: middleware on the route; cards are
     * further narrowed so a role never sees metrics outside its domain.
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $roles = $user->roles->pluck('role')->all();
        $has = fn (string ...$candidates): bool => array_intersect($candidates, $roles) !== [];

        $cards = [];
        $stats = null;

        if ($has('super_admin', 'administrator')) {
            $stats = [
                'total_users' => DB::table('users')->whereNull('deleted_at')->count(),
                'total_vendors' => DB::table('vendors')->whereNull('deleted_at')->count(),
                'total_orders' => DB::table('vendor_orders')->whereNull('deleted_at')->count(),
                'total_revenue' => (float) (DB::table('payments')->where('status', 'succeeded')->sum('amount') ?? 0),
                'pending_approvals' => DB::table('products')->whereNull('approved_at')->count(),
                'open_tickets' => DB::table('tickets')->where('status', 'open')->count(),
            ];
            // Rendered once as the dashboard stat tiles; omitting cards here
            // avoids duplicating the same six figures further down the page.
            $cards = [];
        } elseif ($has('finance_admin')) {
            $cards = [
                ['label' => 'Revenue (succeeded)', 'value' => (float) (DB::table('payments')->where('status', 'succeeded')->sum('amount') ?? 0), 'href' => '/admin/finance', 'icon' => 'revenue', 'format' => 'currency'],
                ['label' => 'Transactions', 'value' => DB::table('payments')->count(), 'href' => '/admin/finance', 'icon' => 'orders'],
                ['label' => 'Refunds', 'value' => DB::table('refunds')->count(), 'href' => '/admin/finance', 'icon' => 'approvals'],
                ['label' => 'Unprocessed Withdrawals', 'value' => DB::table('vendor_withdrawals')->whereNull('processed_at')->count(), 'href' => '/admin/payouts', 'icon' => 'vendors'],
            ];
        } elseif ($has('healthcare_admin')) {
            $cards = [
                ['label' => 'Doctors', 'value' => DB::table('doctors')->whereNull('deleted_at')->count(), 'href' => '/admin/healthcare/doctors', 'icon' => 'health'],
                ['label' => 'Consultations', 'value' => DB::table('consultations')->count(), 'href' => '/admin/healthcare/doctors', 'icon' => 'health'],
                ['label' => 'Health Tickets', 'value' => DB::table('health_tickets')->whereNull('deleted_at')->count(), 'href' => '/admin/healthcare/doctors', 'icon' => 'tickets'],
            ];
        } elseif ($has('learning_admin')) {
            $cards = [
                ['label' => 'Courses', 'value' => DB::table('courses')->whereNull('deleted_at')->count(), 'href' => '/admin/learning/courses', 'icon' => 'learn'],
                ['label' => 'Enrollments', 'value' => DB::table('enrollments')->count(), 'href' => '/admin/learning/courses', 'icon' => 'users'],
            ];
        } elseif ($has('learning_reviewer')) {
            $cards = [
                ['label' => 'Awaiting Review', 'value' => DB::table('learn_posts')->whereIn('status', ['pending', 'under_review', 'needs_information'])->whereNull('deleted_at')->count(), 'href' => '/admin/learning/review', 'icon' => 'learn'],
                ['label' => 'Open Reports', 'value' => DB::table('learn_post_reports')->where('status', 'open')->whereNull('deleted_at')->count(), 'href' => '/admin/learning/review', 'icon' => 'approvals'],
            ];
        } elseif ($has('support_agent', 'customer_service', 'support_admin')) {
            $cards = [
                ['label' => 'Open Tickets', 'value' => DB::table('tickets')->where('status', 'open')->count(), 'href' => '/admin/support/tickets', 'icon' => 'tickets'],
                ['label' => 'Total Tickets', 'value' => DB::table('tickets')->count(), 'href' => '/admin/support/tickets', 'icon' => 'tickets'],
                ['label' => 'Departments', 'value' => DB::table('departments')->count(), 'href' => '/admin/departments', 'icon' => 'vendors'],
            ];
        } elseif ($has('content_manager')) {
            $cards = [
                ['label' => 'CMS Pages', 'value' => DB::table('cms_pages')->whereNull('deleted_at')->count(), 'href' => '/admin/cms', 'icon' => 'cms'],
            ];
        } elseif ($has('marketplace_admin')) {
            // Approvals count honors the assigned category scope so the card
            // always matches the (scoped) /admin/approvals page it links to.
            $scope = $this->productCategoryScope($request);
            $cards = [
                ['label' => 'Products in My Scope', 'value' => $this->scopedProductCount($user->id), 'href' => null, 'icon' => 'orders'],
                ['label' => 'Pending Approvals', 'value' => DB::table('products')->whereNull('approved_at')
                    ->when($scope !== null, fn ($q) => $q->where('products.category', $scope))
                    ->count(), 'href' => '/admin/approvals', 'icon' => 'approvals'],
                ['label' => 'Categories', 'value' => count($this->subtreeIds($this->permissions->managedCategoryId($user->id))), 'href' => '/admin/categories', 'icon' => 'vendors'],
            ];
        } elseif ($has('moderator')) {
            $cards = [
                ['label' => 'Pending Approvals', 'value' => DB::table('products')->whereNull('approved_at')->count(), 'href' => '/admin/approvals', 'icon' => 'approvals'],
                ['label' => 'Rejected Products', 'value' => DB::table('rejected_products')->count(), 'href' => null, 'icon' => 'orders'],
            ];
        } elseif ($has('hotel_admin')) {
            $cards = [
                ['label' => 'Hotels', 'value' => DB::table('hotels')->count(), 'href' => '/admin/hotels', 'icon' => 'vendors'],
                ['label' => 'Reservations', 'value' => DB::table('hotel_reservations')->count(), 'href' => '/admin/hotels', 'icon' => 'orders'],
            ];
        } elseif ($has('food_admin')) {
            $cards = [
                ['label' => 'Restaurants', 'value' => DB::table('restaurants')->count(), 'href' => '/admin/food', 'icon' => 'vendors'],
                ['label' => 'Food Orders', 'value' => DB::table('food_orders')->count(), 'href' => '/admin/food', 'icon' => 'orders'],
            ];
        } elseif ($has('transport_admin')) {
            $cards = [
                ['label' => 'Rides', 'value' => DB::table('rides')->count(), 'href' => '/admin/transport', 'icon' => 'orders'],
                ['label' => 'Flights', 'value' => DB::table('flights')->count(), 'href' => '/admin/transport', 'icon' => 'orders'],
            ];
        } elseif ($has('jobs_admin')) {
            $cards = [
                ['label' => 'Job Posts', 'value' => DB::table('job_posts')->whereNull('deleted_at')->count(), 'href' => '/admin/jobs', 'icon' => 'vendors'],
                ['label' => 'Applications', 'value' => DB::table('job_applications')->whereNull('deleted_at')->count(), 'href' => '/admin/jobs', 'icon' => 'users'],
            ];
        } elseif ($has('pharmacy_admin')) {
            $cards = [
                ['label' => 'Medicines', 'value' => DB::table('medicines')->count(), 'href' => '/admin/pharmacy', 'icon' => 'orders'],
                ['label' => 'Medicine Orders', 'value' => DB::table('medicine_orders')->whereNull('deleted_at')->count(), 'href' => '/admin/pharmacy', 'icon' => 'orders'],
            ];
        } elseif ($has('building_admin')) {
            $cards = [
                ['label' => 'Building Bookings', 'value' => DB::table('building_service_bookings')->whereNull('deleted_at')->count(), 'href' => '/admin/building', 'icon' => 'orders'],
            ];
        } elseif ($has('kyc_reviewer')) {
            $cards = [
                ['label' => 'Awaiting Review', 'value' => DB::table('kyc_verifications')->whereNull('deleted_at')->whereIn('status', ['pending', 'submitted'])->count(), 'href' => '/admin/kyc', 'icon' => 'approvals'],
                ['label' => 'Approved', 'value' => DB::table('kyc_verifications')->whereNull('deleted_at')->where('status', 'approved')->count(), 'href' => '/admin/kyc', 'icon' => 'users'],
                ['label' => 'Rejected', 'value' => DB::table('kyc_verifications')->whereNull('deleted_at')->where('status', 'rejected')->count(), 'href' => '/admin/kyc', 'icon' => 'orders'],
            ];
        } elseif ($has('platform_ops')) {
            $cards = [
                ['label' => 'Orders', 'value' => DB::table('vendor_orders')->whereNull('deleted_at')->count(), 'href' => '/admin/orders', 'icon' => 'orders'],
                ['label' => 'Pending Approvals', 'value' => DB::table('products')->whereNull('approved_at')->count(), 'href' => '/admin/approvals', 'icon' => 'approvals'],
                ['label' => 'Open Returns', 'value' => DB::table('return_requests')->count(), 'href' => '/admin/returns', 'icon' => 'tickets'],
            ];
        } elseif ($has('security_admin')) {
            $cards = [
                ['label' => 'KYC Awaiting Review', 'value' => DB::table('kyc_verifications')->whereNull('deleted_at')->whereIn('status', ['pending', 'submitted'])->count(), 'href' => '/admin/kyc', 'icon' => 'approvals'],
                ['label' => 'Suspended Users', 'value' => DB::table('users')->whereNull('deleted_at')->whereNotNull('suspended_at')->count(), 'href' => '/admin/users', 'icon' => 'users'],
                ['label' => 'Audit Entries', 'value' => DB::table('audit_logs')->count(), 'href' => '/admin/audit-logs', 'icon' => 'tickets'],
            ];
        } elseif ($has('analytics_admin')) {
            $cards = [
                ['label' => 'Events (total)', 'value' => DB::table('analytics_events')->count(), 'href' => '/admin/analytics', 'icon' => 'orders'],
                ['label' => 'Events Today', 'value' => DB::table('analytics_events')->whereDate('created_at', today())->count(), 'href' => '/admin/analytics', 'icon' => 'approvals'],
                ['label' => 'Active Users', 'value' => DB::table('analytics_events')->distinct('user_id')->count('user_id'), 'href' => '/admin/analytics', 'icon' => 'users'],
            ];
        } elseif ($has('orders_admin')) {
            $cards = [
                ['label' => 'Orders', 'value' => DB::table('vendor_orders')->whereNull('deleted_at')->count(), 'href' => '/admin/orders', 'icon' => 'orders'],
                ['label' => 'Open Returns', 'value' => DB::table('return_requests')->count(), 'href' => '/admin/returns', 'icon' => 'tickets'],
                ['label' => 'Refunds', 'value' => DB::table('refunds')->count(), 'href' => '/admin/finance', 'icon' => 'approvals'],
            ];
        } elseif ($has('wallet_admin')) {
            $cards = [
                ['label' => 'Payments', 'value' => DB::table('payments')->count(), 'href' => '/admin/wallet', 'icon' => 'orders'],
                ['label' => 'Unprocessed Withdrawals', 'value' => DB::table('vendor_withdrawals')->whereNull('processed_at')->count(), 'href' => '/admin/payouts', 'icon' => 'vendors'],
                ['label' => 'Wallets', 'value' => DB::table('wallets')->count(), 'href' => '/admin/wallet', 'icon' => 'revenue'],
            ];
        } elseif ($has('real_estate_admin')) {
            $cards = [
                ['label' => 'Properties', 'value' => DB::table('properties')->whereNull('deleted_at')->count(), 'href' => '/admin/real-estate', 'icon' => 'vendors'],
                ['label' => 'Viewing Requests', 'value' => DB::table('viewing_requests')->count(), 'href' => '/admin/real-estate', 'icon' => 'tickets'],
            ];
        } elseif ($has('needs_admin')) {
            $cards = [
                ['label' => 'Needs', 'value' => DB::table('need_requests')->count(), 'href' => null, 'icon' => 'orders'],
                ['label' => 'Offers', 'value' => DB::table('need_offers')->count(), 'href' => null, 'icon' => 'vendors'],
                ['label' => 'Tasks', 'value' => DB::table('task_posts')->count(), 'href' => null, 'icon' => 'tickets'],
            ];
        } elseif ($has('payout_reviewer')) {
            $cards = [
                ['label' => 'Unprocessed Withdrawals', 'value' => DB::table('vendor_withdrawals')->whereNull('processed_at')->count(), 'href' => '/admin/payouts', 'icon' => 'approvals'],
                ['label' => 'Withdrawals (total)', 'value' => DB::table('vendor_withdrawals')->count(), 'href' => '/admin/payouts', 'icon' => 'orders'],
            ];
        } elseif ($has('refund_agent')) {
            $cards = [
                ['label' => 'Orders', 'value' => DB::table('vendor_orders')->whereNull('deleted_at')->count(), 'href' => '/admin/orders', 'icon' => 'orders'],
                ['label' => 'Refunds', 'value' => DB::table('refunds')->count(), 'href' => '/admin/returns', 'icon' => 'approvals'],
                ['label' => 'Open Returns', 'value' => DB::table('return_requests')->count(), 'href' => '/admin/returns', 'icon' => 'tickets'],
            ];
        } elseif ($has('inventory_manager')) {
            $cards = [
                ['label' => 'Stock Levels', 'value' => DB::table('stock_levels')->count(), 'href' => '/admin/inventory', 'icon' => 'orders'],
                ['label' => 'Movements', 'value' => DB::table('stock_movements')->count(), 'href' => '/admin/inventory', 'icon' => 'tickets'],
            ];
        } elseif ($has('cms_editor')) {
            $cards = [
                ['label' => 'CMS Pages', 'value' => DB::table('cms_pages')->whereNull('deleted_at')->count(), 'href' => '/admin/cms', 'icon' => 'cms'],
            ];
        } elseif ($has('auditor')) {
            $cards = [
                ['label' => 'Audit Entries', 'value' => DB::table('audit_logs')->count(), 'href' => '/admin/audit-logs', 'icon' => 'tickets'],
            ];
        } elseif ($has('analyst')) {
            $cards = [
                ['label' => 'Events (total)', 'value' => DB::table('analytics_events')->count(), 'href' => '/admin/analytics', 'icon' => 'orders'],
                ['label' => 'Events Today', 'value' => DB::table('analytics_events')->whereDate('created_at', today())->count(), 'href' => '/admin/analytics', 'icon' => 'approvals'],
            ];
        } elseif ($has('vendor_admin')) {
            $vendorId = DB::table('vendors')->where('user_id', $user->id)->value('id');
            $cards = $vendorId
                ? [
                    ['label' => 'My Products', 'value' => DB::table('products')->where('vendor_id', $vendorId)->count(), 'href' => '/vendor/products', 'icon' => 'orders'],
                    ['label' => 'My Orders', 'value' => DB::table('vendor_orders')->where('vendor_id', $vendorId)->whereNull('deleted_at')->count(), 'href' => '/vendor/orders', 'icon' => 'orders'],
                ]
                : [['label' => 'Open Vendor Portal', 'value' => '—', 'href' => '/vendor', 'icon' => 'vendors']];
        }
        // agriculture_admin without matching data above:
        // intentionally empty cards -> honest empty state on the page.

        // Super-only: the Admin Access on/off switches on the dashboard.
        $adminAccess = null;
        if (in_array(AppRole::SUPER_ADMIN->value, $roles, true)) {
            $adminAccess = $this->adminAccessAccounts($user->id);
        }

        return Inertia::render('admin/Dashboard', [
            'cards' => $cards,
            'stats' => $stats,
            'needsAttention' => $this->needsAttention($request),
            'adminAccess' => $adminAccess,
        ]);
    }

    /**
     * Every admin-console account (any role beyond the customer roles)
     * with its roles and suspended state, for the super admin dashboard's
     * access switches. Never shared with non-super sessions.
     */
    private function adminAccessAccounts(string $actorId): array
    {
        $rows = DB::table('users')
            ->join('user_roles', 'user_roles.user_id', '=', 'users.id')
            ->whereNull('users.deleted_at')
            ->whereNotIn('user_roles.role', [AppRole::USER, AppRole::WORKER])
            ->select('users.id', 'users.name', 'users.email', 'users.suspended_at')
            ->distinct()
            ->orderBy('users.name')
            ->limit(200)
            ->get();

        $rolesByUser = DB::table('user_roles')
            ->whereIn('user_id', $rows->pluck('id'))
            ->get()
            ->groupBy('user_id')
            ->map(fn ($group) => $group->pluck('role')->values()->all());

        return $rows->map(fn ($account) => [
            'id' => $account->id,
            'name' => $account->name,
            'email' => $account->email,
            'roles' => $rolesByUser->get($account->id, []),
            'suspended' => $account->suspended_at !== null,
            'is_self' => $account->id === $actorId,
        ])->values()->all();
    }

    /**
     * "Needs Attention": live, server-computed work queues for the signed-in
     * role. Every item counts real rows and links to the console page that
     * resolves them; items are gated on the same router-built admin href
     * registry that drives the sidebar (WorkspaceResolver::adminHrefs), so a
     * role never sees a queue it cannot open. Only queues with count > 0 are
     * returned — the page renders an honest "all clear" otherwise. No task
     * table is written: queues are derived on read (directive: derive from
     * live data, no admin_tasks table).
     *
     * @return list<array{label: string, count: int, href: string, icon: string}>
     */
    private function needsAttention(Request $request): array
    {
        $hrefs = $this->workspace->adminHrefs($request->user());
        $items = [];

        $push = function (string $label, int $count, string $href, string $icon) use (&$items): void {
            if ($count > 0) {
                $items[] = ['label' => $label, 'count' => $count, 'href' => $href, 'icon' => $icon];
            }
        };

        if (in_array('/admin/approvals', $hrefs, true)) {
            $scope = $this->productCategoryScope($request);
            $push(
                'Products awaiting approval',
                DB::table('products')
                    ->whereNull('deleted_at')
                    ->whereNull('approved_at')
                    ->when($scope !== null, fn ($q) => $q->where('products.category', $scope))
                    ->count(),
                '/admin/approvals',
                'approvals',
            );
        }

        if (in_array('/admin/kyc', $hrefs, true)) {
            $push(
                'KYC reviews pending',
                DB::table('kyc_verifications')
                    ->whereNull('deleted_at')
                    ->whereIn('status', ['pending', 'submitted'])
                    ->count(),
                '/admin/kyc',
                'kyc',
            );
        }

        if (in_array('/admin/returns', $hrefs, true)) {
            $push(
                'Open disputes',
                DB::table('disputes')
                    ->whereNull('deleted_at')
                    ->whereIn('status', ['open', 'in_review'])
                    ->count(),
                '/admin/returns',
                'disputes',
            );
            $push(
                'Returns awaiting decision',
                DB::table('return_requests')
                    ->whereNull('deleted_at')
                    ->where('status', 'pending')
                    ->count(),
                '/admin/returns',
                'returns',
            );
        }

        if (in_array('/admin/support/tickets', $hrefs, true)) {
            // Matches the dashboard/reporting "open" convention (status =
            // 'open'); unassigned is a subset of open (nobody claimed it).
            $push(
                'Support tickets open',
                DB::table('tickets')
                    ->whereNull('deleted_at')
                    ->where('status', 'open')
                    ->count(),
                '/admin/support/tickets',
                'tickets',
            );
            $push(
                'Tickets unassigned',
                DB::table('tickets')
                    ->whereNull('deleted_at')
                    ->where('status', 'open')
                    ->whereNull('assigned_to')
                    ->count(),
                '/admin/support/tickets',
                'tickets',
            );
        }

        if (in_array('/admin/payouts', $hrefs, true)) {
            // processed_at is stamped on every decision (approve OR reject),
            // so NULL exactly means "awaiting processing" — same predicate
            // the finance/wallet cards already use.
            $push(
                'Withdrawals awaiting processing',
                DB::table('vendor_withdrawals')
                    ->whereNull('deleted_at')
                    ->whereNull('processed_at')
                    ->count(),
                '/admin/payouts',
                'payouts',
            );
        }

        if (in_array('/admin/vendors', $hrefs, true)) {
            $push(
                'Vendors pending verification',
                DB::table('vendors')
                    ->whereNull('deleted_at')
                    ->where('is_verified', false)
                    ->count(),
                '/admin/vendors',
                'vendors',
            );
        }

        if (in_array('/admin/inventory', $hrefs, true)) {
            // Only products with tracked stock rows and a configured
            // reorder point are flagged (reorder_point = 0 means untracked).
            $push(
                'Stock at or below reorder point',
                DB::table('stock_levels')
                    ->whereNull('deleted_at')
                    ->where('reorder_point', '>', 0)
                    ->whereColumn('quantity', '<=', 'reorder_point')
                    ->count(),
                '/admin/inventory',
                'inventory',
            );
        }

        return $items;
    }

    /**
     * marketplace_admin product count limited to the assigned category scope
     * (user_roles.category_id -> categories.name -> products.category).
     * Unassigned scope (NULL) falls back to the full catalog and is flagged
     * as an unscoped account in the authorization matrix.
     */
    private function scopedProductCount(string $userId): int
    {
        $categoryId = DB::table('user_roles')
            ->where('user_id', $userId)
            ->where('role', 'marketplace_admin')
            ->value('category_id');

        if (! $categoryId) {
            return DB::table('products')->count();
        }

        $categoryName = DB::table('categories')->where('id', $categoryId)->value('name');

        return $categoryName
            ? DB::table('products')->where('category', $categoryName)->count()
            : 0;
    }
}
