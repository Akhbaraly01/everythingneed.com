<?php

namespace Tests\Feature\Notifications;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeNotification(string $userId, bool $read = false, string $title = 'Hello'): string
    {
        $id = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $id,
            'user_id' => $userId,
            'title' => $title,
            'message' => 'Message body for testing',
            'type' => 'general',
            'related_id' => null,
            'is_read' => $read,
            'created_at' => now(),
        ]);

        return $id;
    }

    public function test_all_notification_endpoints_require_authentication(): void
    {
        $id = Str::uuid();

        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->postJson("/api/notifications/{$id}/read")->assertUnauthorized();
        $this->postJson('/api/notifications/read-all')->assertUnauthorized();
        $this->deleteJson("/api/notifications/{$id}")->assertUnauthorized();
    }

    public function test_index_returns_only_own_notifications_with_meta(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $this->makeNotification($me->id, false, 'Mine');
        $this->makeNotification($other->id, false, 'Not mine');

        $response = $this->actingAs($me, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Mine', $response->json('data.0.title'));
        $this->assertArrayHasKey('meta', $response->json());
        $this->assertEquals(1, $response->json('meta.total'));
    }

    public function test_mark_as_read_updates_own_notification(): void
    {
        $me = User::factory()->create();
        $id = $this->makeNotification($me->id, false);

        $this->actingAs($me, 'sanctum')
            ->postJson("/api/notifications/{$id}/read")
            ->assertOk();

        $this->assertDatabaseHas('notifications', ['id' => $id, 'is_read' => true]);
    }

    public function test_mark_as_read_cannot_touch_another_users_notification(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $id = $this->makeNotification($other->id, false);

        $this->actingAs($me, 'sanctum')
            ->postJson("/api/notifications/{$id}/read")
            ->assertNotFound();

        $this->assertDatabaseHas('notifications', ['id' => $id, 'is_read' => false]);
    }

    public function test_mark_as_read_unknown_id_returns_404(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me, 'sanctum')
            ->postJson('/api/notifications/'.Str::uuid().'/read')
            ->assertNotFound();
    }

    public function test_mark_all_as_read_only_touches_own_unread_rows(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $mineUnread = $this->makeNotification($me->id, false, 'Unread');
        $mineRead = $this->makeNotification($me->id, true, 'Already read');
        $theirs = $this->makeNotification($other->id, false, 'Theirs');

        $this->actingAs($me, 'sanctum')
            ->postJson('/api/notifications/read-all')
            ->assertOk();

        $this->assertDatabaseHas('notifications', ['id' => $mineUnread, 'is_read' => true]);
        $this->assertDatabaseHas('notifications', ['id' => $mineRead, 'is_read' => true]);
        $this->assertDatabaseHas('notifications', ['id' => $theirs, 'is_read' => false]);
    }

    public function test_delete_removes_own_notification(): void
    {
        $me = User::factory()->create();
        $id = $this->makeNotification($me->id);

        $this->actingAs($me, 'sanctum')
            ->deleteJson("/api/notifications/{$id}")
            ->assertOk();

        // Soft delete: row is retained for audit but must vanish from lists.
        $this->assertSoftDeleted('notifications', ['id' => $id]);

        $list = $this->actingAs($me, 'sanctum')->getJson('/api/notifications')->assertOk();
        $this->assertEmpty($list->json('data'));
    }

    public function test_delete_cannot_remove_another_users_notification(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $id = $this->makeNotification($other->id);

        $this->actingAs($me, 'sanctum')
            ->deleteJson("/api/notifications/{$id}")
            ->assertNotFound();

        $this->assertDatabaseHas('notifications', ['id' => $id]);
    }
}
