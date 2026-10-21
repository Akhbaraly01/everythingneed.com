<?php

namespace Tests\Feature\Web;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * W15: newsletter subscription flow.
 *
 * Pins the public subscribe endpoint (validation, normalization,
 * idempotent re-subscribe) and the permission-gated subscriptions console.
 */
class NewsletterSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    public function test_guest_can_subscribe_and_email_is_normalized(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'Reader@Example.COM'])
            ->assertStatus(201)
            ->assertJsonPath('message', 'Subscribed successfully.');

        $this->assertDatabaseHas('newsletter_subscriptions', ['email' => 'reader@example.com']);
    }

    public function test_duplicate_subscription_is_idempotent(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'dup@example.com'])
            ->assertStatus(201);

        $this->postJson('/api/newsletter/subscribe', ['email' => 'DUP@example.com'])
            ->assertOk()
            ->assertJsonPath('message', 'This email is already subscribed.');

        $this->assertEquals(1, DB::table('newsletter_subscriptions')->where('email', 'dup@example.com')->count());
    }

    public function test_invalid_email_is_rejected(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'not-an-email'])
            ->assertStatus(422);

        $this->postJson('/api/newsletter/subscribe', [])
            ->assertStatus(422);

        $this->assertEquals(0, DB::table('newsletter_subscriptions')->count());
    }

    public function test_subscriptions_console_is_permission_gated(): void
    {
        DB::table('newsletter_subscriptions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'email' => 'listed@example.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Guest: unauthenticated.
        $this->getJson('/api/newsletter/subscriptions')->assertStatus(401);

        // Plain customer: forbidden.
        $this->actingAsUser();
        $this->getJson('/api/newsletter/subscriptions')->assertStatus(403);
        $this->getJson('/api/newsletter/subscriptions/export')->assertStatus(403);

        // Content manager: sees the list and searches it.
        $this->actingAsUser('content_manager');
        $this->getJson('/api/newsletter/subscriptions?search=listed')
            ->assertOk()
            ->assertJsonFragment(['email' => 'listed@example.com']);
        $this->getJson('/api/newsletter/subscriptions?search=missing')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    public function test_content_manager_can_export_and_remove_subscribers(): void
    {
        $id = (string) \Illuminate\Support\Str::uuid();
        DB::table('newsletter_subscriptions')->insert([
            'id' => $id,
            'email' => 'remove@example.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAsUser('content_manager');

        $export = $this->get('/api/newsletter/subscriptions/export');
        $export->assertOk();
        $this->assertStringContainsString('remove@example.com', $export->streamedContent());

        $this->deleteJson("/api/newsletter/subscriptions/{$id}")->assertOk();
        $this->assertDatabaseMissing('newsletter_subscriptions', ['id' => $id]);
    }
}
