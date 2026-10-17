<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console user CRUD completion:
 *  - PUT /api/admin/users/{id}   profile edits  (permission:users.users.update + can:manageUsers)
 *  - DELETE /api/admin/users/{id} soft delete   (permission:users.users.delete + can:manageUsers,
 *    self-delete 403, last-active-super-admin 409)
 */
class AdminUserCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    /** Direct grant (bypasses the super-only API so tests can build the exact actor they need). */
    private function grant(User $target, string $permission): void
    {
        DB::table('user_permissions')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $target->id,
            'permission' => $permission,
            'granted_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Cache::forget("user.permissions.{$target->id}");
    }

    // ---- profile update -------------------------------------------------

    #[Test]
    public function test_administrator_updates_name_and_email(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@everythingneed.com',
            'email_verified_at' => null,
        ]);

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}", [
                'name' => 'New Name',
                'email' => 'New.Address@everythingneed.com',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.email', 'new.address@everythingneed.com');

        $fresh = User::findOrFail($target->id);
        $this->assertSame('New Name', $fresh->name);
        $this->assertSame('new.address@everythingneed.com', $fresh->email);
        // Console-set addresses stay usable exactly like provisioned ones.
        $this->assertNotNull($fresh->email_verified_at);
    }

    #[Test]
    public function test_security_admin_can_update_profile(): void
    {
        $actor = $this->userWithRole('security_admin');
        $target = User::factory()->create();

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}", ['name' => 'Renamed By Security'])
            ->assertOk();

        $this->assertSame('Renamed By Security', User::findOrFail($target->id)->name);
    }

    #[Test]
    public function test_update_requires_at_least_one_field(): void
    {
        $this->actingAsAdmin();

        $target = User::factory()->create();

        $this->putJson("/api/admin/users/{$target->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided.');
    }

    #[Test]
    public function test_update_rejects_duplicate_email(): void
    {
        $this->actingAsAdmin();

        User::factory()->create(['email' => 'taken@everythingneed.com']);
        $target = User::factory()->create();

        $this->putJson("/api/admin/users/{$target->id}", ['email' => 'taken@everythingneed.com'])
            ->assertStatus(422);
    }

    #[Test]
    public function test_update_404s_for_unknown_user(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/users/' . Str::uuid(), ['name' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_plain_user_cannot_update_profiles(): void
    {
        $actor = User::factory()->create();
        $target = User::factory()->create();

        $this->actingAs($actor, 'sanctum')
            ->putJson("/api/admin/users/{$target->id}", ['name' => 'Hacked'])
            ->assertStatus(403);
    }

    // ---- delete ----------------------------------------------------------

    #[Test]
    public function test_super_admin_deletes_a_user(): void
    {
        $this->actingAsAdmin();

        $target = User::factory()->create();

        $this->deleteJson("/api/admin/users/{$target->id}")
            ->assertOk()
            ->assertJsonPath('message', 'User deleted');

        $this->assertNotNull(
            DB::table('users')->where('id', $target->id)->value('deleted_at')
        );
    }

    #[Test]
    public function test_administrator_without_delete_permission_is_refused(): void
    {
        $actor = $this->userWithRole('administrator');
        $target = User::factory()->create();

        $this->actingAs($actor, 'sanctum')
            ->deleteJson("/api/admin/users/{$target->id}")
            ->assertStatus(403);

        $this->assertNull(
            DB::table('users')->where('id', $target->id)->value('deleted_at')
        );
    }

    #[Test]
    public function test_granted_delete_permission_lets_administrator_delete(): void
    {
        $actor = $this->userWithRole('administrator');
        $this->grant($actor, 'users.users.delete');
        $target = User::factory()->create();

        $this->actingAs($actor, 'sanctum')
            ->deleteJson("/api/admin/users/{$target->id}")
            ->assertOk();

        $this->assertNotNull(
            DB::table('users')->where('id', $target->id)->value('deleted_at')
        );
    }

    #[Test]
    public function test_cannot_delete_your_own_account(): void
    {
        $actor = $this->actingAsAdmin();

        $this->deleteJson("/api/admin/users/{$actor->id}")
            ->assertStatus(403);

        $this->assertNull(
            DB::table('users')->where('id', $actor->id)->value('deleted_at')
        );
    }

    #[Test]
    public function test_last_active_super_admin_cannot_be_deleted(): void
    {
        // The only active super admin is the target; the actor is an
        // administrator holding the delete grant (so the route gate passes
        // and the lockout guard is what refuses the request).
        $super = $this->userWithRole('super_admin');

        $actor = $this->userWithRole('administrator');
        $this->grant($actor, 'users.users.delete');

        $this->actingAs($actor, 'sanctum')
            ->deleteJson("/api/admin/users/{$super->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'The last active super admin cannot be deleted.');

        $this->assertNull(
            DB::table('users')->where('id', $super->id)->value('deleted_at')
        );
    }
}
