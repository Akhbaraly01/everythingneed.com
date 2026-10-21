<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Core\Services\Contracts\NotificationServiceInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminNotificationsConsoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_administrator_can_search_and_remove_notifications(): void
    {
        $recipient = User::factory()->create([
            'name' => 'Search Target',
            'email' => 'target@example.com',
        ]);
        app(NotificationServiceInterface::class)
            ->notify($recipient->id, 'Payout approved', 'Your payout was approved.', 'payout');

        $this->actingAsUser('administrator');

        $id = (string) DB::table('notifications')->value('id');

        $this->getJson('/api/admin/notifications?search=target@example.com')
            ->assertOk()
            ->assertJsonFragment(['id' => $id, 'title' => 'Payout approved']);

        $this->getJson('/api/admin/notifications?type=payout&is_read=unread')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->deleteJson("/api/admin/notifications/{$id}")->assertOk();
        $this->assertSoftDeleted('notifications', ['id' => $id]);
    }

    public function test_send_to_a_single_user_role_and_all_users(): void
    {
        $single = User::factory()->create();
        $roleUser = $this->actingAsUser('content_manager');
        $admin = $this->actingAsUser('administrator');

        $this->postJson('/api/admin/notifications/send', [
            'audience' => 'user',
            'recipient_id' => $single->id,
            'title' => 'Direct message',
            'message' => 'Sent to one user.',
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $single->id,
            'title' => 'Direct message',
        ]);

        $this->postJson('/api/admin/notifications/send', [
            'audience' => 'role',
            'role' => 'content_manager',
            'title' => 'Role message',
            'message' => 'Sent to the content team.',
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $roleUser->id,
            'title' => 'Role message',
        ]);

        $this->postJson('/api/admin/notifications/send', [
            'audience' => 'all',
            'title' => 'Platform message',
            'message' => 'Sent to everyone.',
        ])->assertStatus(201);

        $this->assertSame(
            DB::table('users')->whereNull('deleted_at')->count(),
            DB::table('notifications')->where('title', 'Platform message')->count(),
        );
        $this->assertDatabaseHas('notifications', [
            'user_id' => $admin->id,
            'title' => 'Platform message',
        ]);
    }

    public function test_audiences_and_recipients_are_searchable(): void
    {
        $contentManager = $this->actingAsUser('content_manager');

        $this->actingAsUser('administrator');

        $this->getJson('/api/admin/notifications/audiences')
            ->assertOk()
            ->assertJsonPath('data.users_total', DB::table('users')->whereNull('deleted_at')->count())
            ->assertJsonFragment(['role' => 'content_manager']);

        $this->getJson('/api/admin/notifications/recipients?q=' . urlencode($contentManager->email))
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'email']]])
            ->assertJsonFragment(['id' => $contentManager->id]);
    }

    public function test_non_administrator_cannot_access_notification_management(): void
    {
        $recipient = User::factory()->create();
        app(NotificationServiceInterface::class)
            ->notify($recipient->id, 'Private', 'Private notice.', 'general');
        $id = (string) DB::table('notifications')->value('id');

        $this->actingAsUser('content_manager');

        $this->getJson('/api/admin/notifications')->assertStatus(403);
        $this->getJson('/api/admin/notifications/recipients')->assertStatus(403);
        $this->getJson('/api/admin/notifications/audiences')->assertStatus(403);
        $this->postJson('/api/admin/notifications/send', [
            'audience' => 'all',
            'title' => 'Nope',
            'message' => 'Not allowed.',
        ])->assertStatus(403);
        $this->deleteJson("/api/admin/notifications/{$id}")->assertStatus(403);
        $this->assertDatabaseHas('notifications', ['id' => $id, 'deleted_at' => null]);
    }
}
