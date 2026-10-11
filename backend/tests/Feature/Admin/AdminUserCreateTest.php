<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console user creation: POST /api/admin/users provisions an account
 * through the single guarded role-write path - escalation guards run
 * BEFORE any row exists, so a rejected request leaves nothing behind.
 * Gates: permission:users.users.create + can:manageUsers.
 */
class AdminUserCreateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    #[Test]
    public function test_super_admin_creates_a_user_with_role_and_they_can_log_in(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/users', [
            'name' => 'New Editor',
            'email' => 'editor@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'content_manager',
        ])->assertStatus(201)
            ->assertJsonPath('data.role', 'content_manager')
            ->assertJsonPath('data.email', 'editor@everythingneed.com');

        $created = User::where('email', 'editor@everythingneed.com')->firstOrFail();
        $this->assertTrue($created->hasRole('content_manager'));
        $this->assertNotNull($created->email_verified_at);
        $this->assertNull($created->suspended_at);

        // Provisioned accounts log in immediately (verified, active).
        $this->postJson('/api/auth/login', [
            'email' => 'editor@everythingneed.com',
            'password' => 'Password123!',
        ])->assertOk()
            ->assertJsonPath('message', 'Login successful');
    }

    #[Test]
    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'taken@everythingneed.com']);
        $this->actingAsAdmin();

        $this->postJson('/api/admin/users', [
            'name' => 'Dup',
            'email' => 'taken@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'content_manager',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $this->assertSame(1, User::where('email', 'taken@everythingneed.com')->count());
    }

    #[Test]
    public function test_security_admin_holds_manage_users_but_lacks_the_create_grant(): void
    {
        $sec = User::factory()->create();
        $this->assignRole($sec, 'security_admin');
        $this->actingAs($sec, 'sanctum');

        $this->postJson('/api/admin/users', [
            'name' => 'Nope',
            'email' => 'nope@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'content_manager',
        ])->assertStatus(403);

        $this->assertDatabaseMissing('users', ['email' => 'nope@everythingneed.com']);
    }

    #[Test]
    public function test_administrator_cannot_provision_super_admin(): void
    {
        $actor = User::factory()->create();
        $this->assignRole($actor, 'administrator');
        $this->actingAs($actor, 'sanctum');

        $this->postJson('/api/admin/users', [
            'name' => 'Escalation',
            'email' => 'escalate@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'super_admin',
        ])->assertStatus(403);

        // Guards run before insert: rejected request writes nothing.
        $this->assertDatabaseMissing('users', ['email' => 'escalate@everythingneed.com']);
    }

    #[Test]
    public function test_administrator_can_provision_console_roles(): void
    {
        $actor = User::factory()->create();
        $this->assignRole($actor, 'administrator');
        $this->actingAs($actor, 'sanctum');

        $this->postJson('/api/admin/users', [
            'name' => 'Fresh Moderator',
            'email' => 'moderator2@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'moderator',
        ])->assertStatus(201)
            ->assertJsonPath('data.role', 'moderator');
    }

    #[Test]
    public function test_guest_cannot_create_users(): void
    {
        $this->postJson('/api/admin/users', [
            'name' => 'Ghost',
            'email' => 'ghost@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'user',
        ])->assertStatus(401);

        $this->assertDatabaseMissing('users', ['email' => 'ghost@everythingneed.com']);
    }

    #[Test]
    public function test_validation_requires_all_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/users', [])->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    #[Test]
    public function test_unknown_role_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/admin/users', [
            'name' => 'Weird',
            'email' => 'weird@everythingneed.com',
            'password' => 'Password123!',
            'role' => 'not_a_role',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }
}
