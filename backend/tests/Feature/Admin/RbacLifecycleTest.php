<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\EffectivePermissionResolverInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Http\Requests\GrantPermissionRequest;
use Modules\Admin\Http\Requests\GrantUserPermissionRequest;
use Tests\TestCase;

/**
 * W2 RBAC lifecycle journey: grant -> effective -> revoke (denied row
 * persists, never effective) -> restore -> effective again, plus the
 * downhill-only grant authorization and per-user grant lifecycle.
 */
class RbacLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('permission.scopes');
    }

    private function superAdmin(): User
    {
        $super = User::factory()->create();
        UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($super, 'sanctum');

        return $super;
    }

    public function test_role_grant_revoke_restore_lifecycle_keeps_denied_rows(): void
    {
        $this->superAdmin();

        $subject = User::factory()->create();
        UserRole::create(['user_id' => $subject->id, 'role' => 'moderator']);

        $this->assertFalse($subject->hasPermission('analytics.overview.export'));

        // Grant -> effective.
        $this->postJson('/api/admin/rbac/grant', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ])->assertStatus(200);

        Cache::forget('rbac.matrix');
        $this->assertTrue($subject->fresh()->hasPermission('analytics.overview.export'));

        // Revoke -> denied row persists, no longer effective, matrix hides it
        // but the denied list exposes it for restore.
        $this->postJson('/api/admin/rbac/revoke', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ])->assertStatus(200);

        Cache::forget('rbac.matrix');
        $this->assertFalse($subject->fresh()->hasPermission('analytics.overview.export'));

        $this->assertSame('denied', DB::table('role_permissions')
            ->where('role', 'moderator')
            ->where('permission', 'analytics.overview.export')
            ->value('state'));

        $matrix = $this->getJson('/api/admin/rbac/matrix')->assertOk();
        $moderator = collect($matrix->json('data'))->firstWhere('role', 'moderator');
        $this->assertNotContains('analytics.overview.export', $moderator['permissions']);
        $denied = collect($matrix->json('denied'))->firstWhere('role', 'moderator');
        $this->assertContains('analytics.overview.export', $denied['permissions']);

        // Restore (grant again) -> effective, same row flipped back.
        $this->postJson('/api/admin/rbac/grant', [
            'role' => 'moderator',
            'permission' => 'analytics.overview.export',
        ])->assertStatus(200);

        Cache::forget('rbac.matrix');
        $this->assertTrue($subject->fresh()->hasPermission('analytics.overview.export'));
        $this->assertSame('granted', DB::table('role_permissions')
            ->where('role', 'moderator')
            ->where('permission', 'analytics.overview.export')
            ->value('state'));
        $this->assertSame(1, DB::table('role_permissions')
            ->where('role', 'moderator')
            ->where('permission', 'analytics.overview.export')
            ->count());
    }

    public function test_user_grant_revoke_lifecycle(): void
    {
        $super = $this->superAdmin();

        $subject = User::factory()->create();
        UserRole::create(['user_id' => $subject->id, 'role' => 'user']);

        $this->postJson("/api/admin/users/{$subject->id}/permissions", [
            'permission' => 'products.products.view',
            'note' => 'Lifecycle probe',
        ])->assertStatus(200);

        Cache::forget("user.permissions.{$subject->id}");
        $this->assertTrue($subject->fresh()->hasPermission('products.products.view'));

        $resolver = app(EffectivePermissionResolverInterface::class);
        $this->assertContains('products.products.view', $resolver->all($subject->fresh()));

        $this->deleteJson("/api/admin/users/{$subject->id}/permissions/products.products.view")
            ->assertStatus(200);

        Cache::forget("user.permissions.{$subject->id}");
        $this->assertFalse($subject->fresh()->hasPermission('products.products.view'));
        $this->assertSame('denied', DB::table('user_permissions')
            ->where('user_id', $subject->id)
            ->where('permission', 'products.products.view')
            ->value('state'));
        $this->assertNotContains(
            'products.products.view',
            $resolver->all($subject->fresh()),
            'Denied user grants must not leak into the shared auth.permissions list'
        );

        $this->assertTrue($super->hasPermission('products.products.view'));
    }

    public function test_two_segment_alias_still_resolves_through_resolver(): void
    {
        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);

        // administrator holds users.users.view -> alias users.view resolves.
        $this->assertTrue($admin->hasPermission('users.view'));
        // administrator also holds users.permissions.manage -> alias resolves.
        $this->assertTrue($admin->hasPermission('users.manage'));

        // support_agent holds users.users.view only: view alias resolves but
        // the manage alias does not (users.manage only matches
        // users.permissions.manage, which it does not hold).
        $support = User::factory()->create();
        UserRole::create(['user_id' => $support->id, 'role' => 'support_agent']);
        $this->assertTrue($support->hasPermission('users.view'));
        $this->assertFalse($support->hasPermission('users.manage'));
    }

    public function test_grant_authorization_is_downhill_only(): void
    {
        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);

        // Administrator holds products.products.view -> may grant it.
        $allowed = GrantPermissionRequest::create('/x', 'POST', ['permission' => 'products.products.view']);
        $allowed->setUserResolver(fn () => $admin);
        $this->assertTrue($allowed->authorize());

        // Administrator does NOT hold audit.logs.view (removed from its
        // matrix) -> refused.
        $refused = GrantPermissionRequest::create('/x', 'POST', ['permission' => 'audit.logs.view']);
        $refused->setUserResolver(fn () => $admin);
        $this->assertFalse($refused->authorize());

        // Same rule on the per-user grant request.
        $userGrant = GrantUserPermissionRequest::create('/x', 'POST', ['permission' => 'audit.logs.view']);
        $userGrant->setUserResolver(fn () => $admin);
        $this->assertFalse($userGrant->authorize());

        // super_admin may grant anything.
        $super = User::factory()->create();
        UserRole::create(['user_id' => $super->id, 'role' => 'super_admin']);
        $any = GrantPermissionRequest::create('/x', 'POST', ['permission' => 'users.permissions.manage']);
        $any->setUserResolver(fn () => $super);
        $this->assertTrue($any->authorize());
    }
}
