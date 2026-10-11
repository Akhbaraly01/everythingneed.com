<?php

namespace Tests\Feature\Analytics;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_analytics(): void
    {
        $this->getJson('/api/analytics/events')->assertUnauthorized();
        $this->postJson('/api/analytics/events', ['event_type' => 'x'])->assertUnauthorized();
        $this->getJson('/api/analytics/summary')->assertUnauthorized();
    }

    public function test_user_can_track_event_and_list_only_own(): void
    {
        $me = $this->actingAsUser();
        $other = $this->createUser();

        DB::table('analytics_events')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $other->id,
            'event_type' => 'other_event',
            'created_at' => now(),
        ]);

        $this->postJson('/api/analytics/events', ['event_type' => 'page_view'])
            ->assertCreated();

        $res = $this->getJson('/api/analytics/events');
        $res->assertOk();
        $this->assertSame(1, $res->json('meta.total'));
        $this->assertSame('page_view', $res->json('data.0.event_type'));

        // PII/network fields stripped for non-privileged
        $this->assertStringNotContainsString('ip_address', $res->getContent());
        $this->assertStringNotContainsString('user_agent', $res->getContent());
    }

    public function test_summary_requires_analytics_view_permission(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        $user = $this->createUser();
        $this->assignRole($user, 'user');
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/analytics/summary')->assertForbidden();

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/analytics/summary')->assertOk()->assertJsonStructure([
            'data' => ['total_events', 'today_events', 'unique_users', 'top_event_types'],
        ]);
    }

    public function test_event_validation_requires_event_type(): void
    {
        $this->actingAsUser();
        $this->postJson('/api/analytics/events', [])->assertStatus(422);
    }
}
