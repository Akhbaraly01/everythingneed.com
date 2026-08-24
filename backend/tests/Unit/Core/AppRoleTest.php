<?php

namespace Tests\Unit\Core;

use Core\Enums\AppRole;
use PHPUnit\Framework\TestCase;

class AppRoleTest extends TestCase
{
    public function test_hierarchy_returns_correct_weights(): void
    {
        $hierarchy = AppRole::hierarchy();

        $this->assertIsArray($hierarchy);
        $this->assertSame(10, $hierarchy['super_admin']);
        $this->assertSame(8, $hierarchy['administrator']);
        $this->assertSame(6, $hierarchy['vendor_admin']);
        $this->assertSame(5, $hierarchy['moderator']);
        $this->assertSame(4, $hierarchy['support_staff']);
        $this->assertSame(4, $hierarchy['content_manager']);
        $this->assertSame(4, $hierarchy['finance_admin']);
        $this->assertSame(4, $hierarchy['healthcare_admin']);
        $this->assertSame(4, $hierarchy['learning_admin']);
        $this->assertSame(3, $hierarchy['customer_service']);
        $this->assertSame(3, $hierarchy['category_admin']);
        $this->assertSame(1, $hierarchy['user']);
    }

    public function test_hierarchy_contains_all_roles(): void
    {
        $hierarchy = AppRole::hierarchy();

        foreach (AppRole::cases() as $role) {
            $this->assertArrayHasKey($role->value, $hierarchy, "Role {$role->value} missing from hierarchy");
        }
    }

    public function test_can_access_super_admin_can_access_everything(): void
    {
        $superAdmin = AppRole::SUPER_ADMIN;

        $this->assertTrue($superAdmin->canAccess(AppRole::USER));
        $this->assertTrue($superAdmin->canAccess(AppRole::CUSTOMER_SERVICE));
        $this->assertTrue($superAdmin->canAccess(AppRole::CATEGORY_ADMIN));
        $this->assertTrue($superAdmin->canAccess(AppRole::MODERATOR));
        $this->assertTrue($superAdmin->canAccess(AppRole::SUPPORT_STAFF));
        $this->assertTrue($superAdmin->canAccess(AppRole::VENDOR_ADMIN));
        $this->assertTrue($superAdmin->canAccess(AppRole::ADMINISTRATOR));
        $this->assertTrue($superAdmin->canAccess(AppRole::SUPER_ADMIN));
    }

    public function test_can_access_user_cannot_access_admin_roles(): void
    {
        $user = AppRole::USER;

        $this->assertTrue($user->canAccess(AppRole::USER));
        $this->assertFalse($user->canAccess(AppRole::CUSTOMER_SERVICE));
        $this->assertFalse($user->canAccess(AppRole::CATEGORY_ADMIN));
        $this->assertFalse($user->canAccess(AppRole::MODERATOR));
        $this->assertFalse($user->canAccess(AppRole::SUPPORT_STAFF));
        $this->assertFalse($user->canAccess(AppRole::VENDOR_ADMIN));
        $this->assertFalse($user->canAccess(AppRole::ADMINISTRATOR));
        $this->assertFalse($user->canAccess(AppRole::SUPER_ADMIN));
    }

    public function test_can_access_same_role_returns_true(): void
    {
        $this->assertTrue(AppRole::USER->canAccess(AppRole::USER));
        $this->assertTrue(AppRole::MODERATOR->canAccess(AppRole::MODERATOR));
        $this->assertTrue(AppRole::ADMINISTRATOR->canAccess(AppRole::ADMINISTRATOR));
        $this->assertTrue(AppRole::SUPER_ADMIN->canAccess(AppRole::SUPER_ADMIN));
    }

    public function test_can_access_moderator_can_access_support_staff(): void
    {
        $moderator = AppRole::MODERATOR;

        $this->assertTrue($moderator->canAccess(AppRole::SUPPORT_STAFF));
        $this->assertTrue($moderator->canAccess(AppRole::CONTENT_MANAGER));
        $this->assertTrue($moderator->canAccess(AppRole::FINANCE_ADMIN));
        $this->assertTrue($moderator->canAccess(AppRole::USER));
    }

    public function test_can_access_moderator_cannot_access_vendor_admin(): void
    {
        $moderator = AppRole::MODERATOR;

        $this->assertFalse($moderator->canAccess(AppRole::VENDOR_ADMIN));
        $this->assertFalse($moderator->canAccess(AppRole::ADMINISTRATOR));
        $this->assertFalse($moderator->canAccess(AppRole::SUPER_ADMIN));
    }

    public function test_can_access_customer_service_can_access_user(): void
    {
        $cs = AppRole::CUSTOMER_SERVICE;

        $this->assertTrue($cs->canAccess(AppRole::USER));
        $this->assertFalse($cs->canAccess(AppRole::MODERATOR));
    }

    public function test_values_returns_all_role_strings(): void
    {
        $values = AppRole::values();

        $this->assertIsArray($values);
        $this->assertContains('super_admin', $values);
        $this->assertContains('administrator', $values);
        $this->assertContains('vendor_admin', $values);
        $this->assertContains('moderator', $values);
        $this->assertContains('support_staff', $values);
        $this->assertContains('content_manager', $values);
        $this->assertContains('finance_admin', $values);
        $this->assertContains('healthcare_admin', $values);
        $this->assertContains('learning_admin', $values);
        $this->assertContains('customer_service', $values);
        $this->assertContains('category_admin', $values);
        $this->assertContains('user', $values);
    }

    public function test_values_returns_correct_count(): void
    {
        $values = AppRole::values();

        $this->assertCount(12, $values);
    }

    public function test_label_returns_human_readable_labels(): void
    {
        $this->assertSame('Super Admin', AppRole::SUPER_ADMIN->label());
        $this->assertSame('Category Admin', AppRole::CATEGORY_ADMIN->label());
        $this->assertSame('Customer Service', AppRole::CUSTOMER_SERVICE->label());
        $this->assertSame('User', AppRole::USER->label());
        $this->assertSame('Administrator', AppRole::ADMINISTRATOR->label());
        $this->assertSame('Vendor Admin', AppRole::VENDOR_ADMIN->label());
        $this->assertSame('Moderator', AppRole::MODERATOR->label());
        $this->assertSame('Support Staff', AppRole::SUPPORT_STAFF->label());
        $this->assertSame('Content Manager', AppRole::CONTENT_MANAGER->label());
        $this->assertSame('Finance Admin', AppRole::FINANCE_ADMIN->label());
        $this->assertSame('Healthcare Admin', AppRole::HEALTHCARE_ADMIN->label());
        $this->assertSame('Learning Admin', AppRole::LEARNING_ADMIN->label());
    }

    public function test_label_returns_string_for_every_role(): void
    {
        foreach (AppRole::cases() as $role) {
            $label = $role->label();
            $this->assertIsString($label);
            $this->assertNotEmpty($label);
        }
    }

    public function test_enum_backed_values_match(): void
    {
        $this->assertSame('super_admin', AppRole::SUPER_ADMIN->value);
        $this->assertSame('category_admin', AppRole::CATEGORY_ADMIN->value);
        $this->assertSame('customer_service', AppRole::CUSTOMER_SERVICE->value);
        $this->assertSame('user', AppRole::USER->value);
        $this->assertSame('administrator', AppRole::ADMINISTRATOR->value);
        $this->assertSame('vendor_admin', AppRole::VENDOR_ADMIN->value);
        $this->assertSame('moderator', AppRole::MODERATOR->value);
        $this->assertSame('support_staff', AppRole::SUPPORT_STAFF->value);
        $this->assertSame('content_manager', AppRole::CONTENT_MANAGER->value);
        $this->assertSame('finance_admin', AppRole::FINANCE_ADMIN->value);
        $this->assertSame('healthcare_admin', AppRole::HEALTHCARE_ADMIN->value);
        $this->assertSame('learning_admin', AppRole::LEARNING_ADMIN->value);
    }

    public function test_hierarchy_weights_are_unique_groups(): void
    {
        $hierarchy = AppRole::hierarchy();
        $weights = array_values($hierarchy);

        sort($weights);
        $uniqueWeights = array_unique($weights);

        $this->assertContains(10, $uniqueWeights);
        $this->assertContains(8, $uniqueWeights);
        $this->assertContains(6, $uniqueWeights);
        $this->assertContains(5, $uniqueWeights);
        $this->assertContains(4, $uniqueWeights);
        $this->assertContains(3, $uniqueWeights);
        $this->assertContains(1, $uniqueWeights);
    }
}
