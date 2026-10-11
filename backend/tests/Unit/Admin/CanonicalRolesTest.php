<?php

namespace Tests\Unit\Admin;

use Core\Enums\AppRole;
use Modules\Admin\Http\Controllers\AdminRbacController;
use PHPUnit\Framework\TestCase;

/**
 * AdminRbacController::ROLES (API contract for /api/admin/rbac/roles)
 * must stay identical to the canonical AppRole enum — the roles endpoint
 * and the seeder matrix are consumed by the RBAC admin UI and tests.
 */
class CanonicalRolesTest extends TestCase
{
    public function test_roles_constant_matches_app_role_enum(): void
    {
        $this->assertEqualsCanonicalizing(
            AppRole::values(),
            AdminRbacController::ROLES,
        );
    }

    public function test_roles_constant_has_no_duplicates(): void
    {
        $this->assertSame(
            array_unique(AdminRbacController::ROLES),
            AdminRbacController::ROLES,
        );
    }

    public function test_every_role_has_a_label_and_hierarchy_weight(): void
    {
        $hierarchy = AppRole::hierarchy();

        foreach (AppRole::cases() as $role) {
            $this->assertNotSame('', $role->label(), "Missing label for {$role->value}");
            $this->assertArrayHasKey($role->value, $hierarchy, "Missing hierarchy weight for {$role->value}");
        }
    }
}
