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
            AppRole::PAYOUT_REVIEWER, AppRole::REFUND_AGENT, AppRole::INVENTORY_MANAGER,
            AppRole::CMS_EDITOR, AppRole::AUDITOR, AppRole::ANALYST,
            AppRole::CATEGORY_ADMIN, AppRole::VENDOR_MANAGER, AppRole::CONTENT_ADMIN,
        ]);
    }

    /**
     * Only super_admin and administrator can manage users.
     * security_admin included (W1 parity: /admin/users web group) — its
     * MATRIX grants cover users.users.view/update/suspend/activate.
     */
    public function manageUsers(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::SECURITY_ADMIN,
        ]);
    }

    /**
     * Vendor management: super_admin, administrator, vendor_admin + platform_ops
     * (W1 parity with the /admin/vendors web group; MATRIX vendors.*) and
     * vendor_manager (spec §65).
     */
    public function manageVendors(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::VENDOR_ADMIN,
            AppRole::PLATFORM_OPS, AppRole::VENDOR_MANAGER,
        ]);
    }

    /**
     * Order management: super_admin, administrator + the orders-console roles
     * (W1 parity with /admin/orders and /admin/returns web groups).
     */
    public function manageOrders(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::PLATFORM_OPS,
            AppRole::ORDERS_ADMIN, AppRole::REFUND_AGENT,
        ]);
    }

    /**
     * Finance is restricted to super_admin and finance_admin.
     */
    public function viewFinance(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::FINANCE_ADMIN]);
    }

    /**
     * Content management for super_admin and content_manager.
     */
    public function manageContent(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::CONTENT_MANAGER]);
    }

    /**
     * Analytics for super_admin, administrator, analytics_admin and analyst
     * (W1 parity with the /admin/analytics web group).
     */
    public function viewAnalytics(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::ANALYTICS_ADMIN,
            AppRole::ANALYST,
        ]);
    }

    /**
     * Support operations — mirrors the /admin/support web route roles.
     */
    public function manageSupport(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::SUPPORT_AGENT,
            AppRole::CUSTOMER_SERVICE, AppRole::SUPPORT_ADMIN,
        ]);
    }

    /**
     * Healthcare management for super_admin and healthcare_admin.
     */
    public function manageHealthcare(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::HEALTHCARE_ADMIN]);
    }

    /**
     * Learning management for super_admin and learning_admin.
     */
    public function manageLearning(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::LEARNING_ADMIN]);
    }

    /**
     * System settings - super_admin and administrator (both hold the
     * settings.* permissions in the role matrix; the Settings/System nav
     * entries declare settings.system.update so visibility matches the gate).
     */
    public function manageSettings(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR]);
    }

    /**
     * Audit logs — super_admin only.
     */
    public function viewAuditLogs(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::SECURITY_ADMIN, AppRole::AUDITOR]);
    }

    /**
     * Finance management — super_admin, finance_admin + the finance-console
     * roles (W1 parity with /admin/finance, /admin/payouts, /admin/wallet web
     * groups; MATRIX finance/payments grants cover administrator, wallet_admin
     * and payout_reviewer).
     */
    public function manageFinance(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::FINANCE_ADMIN,
            AppRole::WALLET_ADMIN, AppRole::PAYOUT_REVIEWER,
        ]);
    }

    /**
     * CMS management — mirrors the /admin/cms web route roles.
     */
    public function manageCms(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::CONTENT_MANAGER,
            AppRole::CMS_EDITOR, AppRole::CONTENT_ADMIN,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Fetches the user's AppRole from the user_roles table.
     */
    private function getUserRole(User $user): ?AppRole
    {
        $roleValue = $this->permissions->primaryRole($user->id);

        if (! $roleValue) {
            return null;
        }

        return AppRole::tryFrom($roleValue);
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
