<?php

namespace Modules\Admin\Policies;

use App\Models\User;
use Core\Enums\AppRole;
use Core\Services\Contracts\PermissionServiceInterface;

/**
 * AdminPolicy — Gate definitions for all admin-level operations.
 *
 * Gates are registered in AuthServiceProvider::boot().
 * Each method receives the authenticated User and returns bool.
 *
 * Permissions are the single source of truth: every gate below (except the
 * documented dashboard exemption) delegates to the effective-permission
 * resolver, so granting/revoking a permission takes effect immediately on
 * both the page middleware and the API `can:` checks.
 */
class AdminPolicy
{
    public function __construct(private PermissionServiceInterface $permissions) {}

    /**
     * Any admin-console role can view the dashboard.
     *
     * MUST stay in lockstep with the `$adminConsoleRoles` set on the
     * /admin/dashboard route (routes/web.php) — page 200 + API 403 would
     * otherwise leak. vendor_admin is intentionally excluded (provider
     * workspace; matrix test denies /admin/dashboard for it).
     */
    public function viewDashboard(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::PLATFORM_OPS,
            AppRole::SECURITY_ADMIN, AppRole::FINANCE_ADMIN,
            AppRole::HEALTHCARE_ADMIN, AppRole::LEARNING_ADMIN, AppRole::LEARNING_REVIEWER,
            AppRole::SUPPORT_AGENT,
            AppRole::CUSTOMER_SERVICE, AppRole::CONTENT_MANAGER, AppRole::MARKETPLACE_ADMIN,
            AppRole::MODERATOR, AppRole::HOTEL_ADMIN, AppRole::FOOD_ADMIN,
            AppRole::TRANSPORT_ADMIN, AppRole::JOBS_ADMIN, AppRole::PHARMACY_ADMIN,
            AppRole::AGRICULTURE_ADMIN, AppRole::BUILDING_ADMIN, AppRole::KYC_REVIEWER,
            AppRole::ANALYTICS_ADMIN, AppRole::ORDERS_ADMIN, AppRole::WALLET_ADMIN,
            AppRole::SUPPORT_ADMIN, AppRole::REAL_ESTATE_ADMIN, AppRole::NEEDS_ADMIN,
            AppRole::NEEDS_VIEWER,
            AppRole::PAYOUT_REVIEWER, AppRole::REFUND_AGENT, AppRole::INVENTORY_MANAGER,
            AppRole::CMS_EDITOR, AppRole::AUDITOR, AppRole::ANALYST,
            AppRole::CATEGORY_ADMIN, AppRole::VENDOR_MANAGER, AppRole::CONTENT_ADMIN,
        ]);
    }

    /**
     * Users console: requires the console-management permission.
     */
    public function manageUsers(User $user): bool
    {
        return $user->hasPermission('users.users.manage');
    }

    /**
     * Vendors console: read access to the vendor registry.
     */
    public function manageVendors(User $user): bool
    {
        return $user->hasPermission('vendors.vendors.view');
    }

    /**
     * Orders/returns console: read access to order data.
     */
    public function manageOrders(User $user): bool
    {
        return $user->hasPermission('orders.orders.view');
    }

    /**
     * Finance overview is restricted to finance-overview holders.
     */
    public function viewFinance(User $user): bool
    {
        return $user->hasPermission('finance.overview.view');
    }

    /**
     * Legacy content gate — CMS page membership.
     */
    public function manageContent(User $user): bool
    {
        return $user->hasPermission('cms.pages.manage');
    }

    /**
     * Analytics console.
     */
    public function viewAnalytics(User $user): bool
    {
        return $user->hasPermission('analytics.overview.view');
    }

    /**
     * Support console.
     */
    public function manageSupport(User $user): bool
    {
        return $user->hasPermission('support.tickets.view');
    }

    /**
     * Healthcare console.
     */
    public function manageHealthcare(User $user): bool
    {
        return $user->hasPermission('healthcare.overview.view');
    }

    /**
     * Learning console.
     */
    public function manageLearning(User $user): bool
    {
        return $user->hasPermission('learn.overview.view');
    }

    /**
     * System settings.
     */
    public function manageSettings(User $user): bool
    {
        return $user->hasPermission('settings.system.update');
    }

    /**
     * Audit logs.
     */
    public function viewAuditLogs(User $user): bool
    {
        return $user->hasPermission('audit.logs.view');
    }

    /**
     * Finance operations — any of the finance-console permissions.
     */
    public function manageFinance(User $user): bool
    {
        return $this->hasAnyPermission($user, [
            'finance.overview.view',
            'finance.payments.manage',
            'finance.refunds.process',
            'finance.payouts.manage',
            'finance.transactions.view',
        ]);
    }

    /**
     * CMS management.
     */
    public function manageCms(User $user): bool
    {
        return $user->hasPermission('cms.pages.manage');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Returns true if the user holds any of the given permissions.
     *
     * @param  list<string>  $permissions
     */
    private function hasAnyPermission(User $user, array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true if any of the user's roles is in the given list of allowed roles.
     *
     * @param  AppRole[]  $allowedRoles
     */
    private function hasRole(User $user, array $allowedRoles): bool
    {
        $values = array_map(fn (AppRole $role) => $role->value, $allowedRoles);

        return $this->permissions->hasAnyRole($user->id, $values);
    }
}
