<?php

namespace Tests\Feature\Web;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * W15: newsletter subscription flow.
 *
 * Pins the public subscribe endpoint (validation, normalization,
 * idempotent re-subscribe) and the role-gated subscriptions index.
 */
class NewsletterSubscriptionTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_subscriptions_index_is_role_gated(): void
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

        // Content manager: sees the list.
        $this->actingAsUser('content_manager');
        $this->getJson('/api/newsletter/subscriptions')
            ->assertOk()
            ->assertJsonFragment(['email' => 'listed@example.com']);
    }
}
