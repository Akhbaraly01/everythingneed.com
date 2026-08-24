<?php

namespace Modules\Admin\Policies;

use App\Models\User;
use Core\Enums\AppRole;
use Illuminate\Support\Facades\DB;

/**
 * AdminPolicy — Gate definitions for all admin-level operations.
 *
 * Gates are registered in AuthServiceProvider::boot().
 * Each method receives the authenticated User and returns bool.
 */
class AdminPolicy
{
    /**
     * Any admin-level role can view the dashboard.
     */
    public function viewDashboard(User $user): bool
    {
        $role = $this->getUserRole($user);
        if (! $role) {
            return false;
        }

        $adminRoles = [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::VENDOR_ADMIN,
            AppRole::MODERATOR, AppRole::SUPPORT_STAFF, AppRole::CONTENT_MANAGER,
            AppRole::FINANCE_ADMIN, AppRole::HEALTHCARE_ADMIN, AppRole::LEARNING_ADMIN,
            AppRole::CUSTOMER_SERVICE, AppRole::CATEGORY_ADMIN,
        ];

        return in_array($role, $adminRoles, true);
    }

    /**
     * Only super_admin and administrator can manage users.
     */
    public function manageUsers(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR]);
    }

    /**
     * Vendor management is open to super_admin, administrator, and vendor_admin.
     */
    public function manageVendors(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR, AppRole::VENDOR_ADMIN,
        ]);
    }

    /**
     * Order management requires super_admin or administrator.
     */
    public function manageOrders(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR]);
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
     * Analytics for super_admin and administrator.
     */
    public function viewAnalytics(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::ADMINISTRATOR]);
    }

    /**
     * Support operations for super_admin, support_staff, and customer_service.
     */
    public function manageSupport(User $user): bool
    {
        return $this->hasRole($user, [
            AppRole::SUPER_ADMIN, AppRole::SUPPORT_STAFF, AppRole::CUSTOMER_SERVICE,
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
     * System settings — super_admin only.
     */
    public function manageSettings(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN]);
    }

    /**
     * Audit logs — super_admin only.
     */
    public function viewAuditLogs(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN]);
    }

    /**
     * Finance management — super_admin and finance_admin.
     */
    public function manageFinance(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::FINANCE_ADMIN]);
    }

    /**
     * CMS management — super_admin and content_manager.
     */
    public function manageCms(User $user): bool
    {
        return $this->hasRole($user, [AppRole::SUPER_ADMIN, AppRole::CONTENT_MANAGER]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Fetches the user's AppRole from the user_roles table.
     */
    private function getUserRole(User $user): ?AppRole
    {
        $roleValue = DB::table('user_roles')
            ->where('user_id', $user->id)
            ->value('role');

        if (! $roleValue) {
            return null;
        }

        return AppRole::tryFrom($roleValue);
    }

    /**
     * Returns true if the user's role is in the given list of allowed roles.
     *
     * @param  AppRole[]  $allowedRoles
     */
    private function hasRole(User $user, array $allowedRoles): bool
    {
        $role = $this->getUserRole($user);
        if (! $role) {
            return false;
        }

        return in_array($role, $allowedRoles, true);
    }
}
