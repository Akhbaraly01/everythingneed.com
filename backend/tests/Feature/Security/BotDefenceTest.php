<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Phase 5: bot defence + mutation rate limiting.
 *
 * Turnstile is inactive without TURNSTILE_SECRET (local/test/dev keep
 * working); with a secret configured, missing/invalid tokens fail closed.
 * Mutating API traffic additionally shares a tight per-actor window.
 */
class BotDefenceTest extends TestCase
{
    use RefreshDatabase;

    private function registration(string $email): array
    {
        return [
            'email' => $email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'full_name' => 'Bot Probe',
        ];
    }

    public function test_auth_endpoints_skip_turnstile_without_a_secret(): void
    {
        config(['services.turnstile.secret' => '']);

        $this->postJson('/api/auth/register', $this->registration('no-key@example.com'))
            ->assertCreated();
    }

    public function test_a_missing_secret_fails_closed_where_the_bot_defence_is_required(): void
    {
        // Production posture: an unconfigured bot defence must refuse the
        // request (503) instead of letting an unverified login through.
        config(['services.turnstile.secret' => '', 'services.turnstile.required' => true]);

        $this->postJson('/api/auth/register', $this->registration('required@example.com'))
            ->assertStatus(503);

        $this->assertDatabaseMissing('users', ['email' => 'required@example.com']);

        // The same posture with a secret configured enforces the token.
        config(['services.turnstile.secret' => 'test-secret']);

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false], 200),
        ]);

        $this->postJson('/api/auth/register', $this->registration('required@example.com'))
            ->assertStatus(422);
    }

    public function test_the_bot_defence_can_be_required_explicitly(): void
    {
        // TURNSTILE_REQUIRED=true forces the fail-closed behaviour even
        // outside production.
        config(['services.turnstile.secret' => '', 'services.turnstile.required' => true]);

        $this->postJson('/api/auth/register', $this->registration('forced@example.com'))
            ->assertStatus(503);

        $this->assertDatabaseMissing('users', ['email' => 'forced@example.com']);
    }

    public function test_configured_turnstile_rejects_missing_and_bad_tokens(): void
    {
        config(['services.turnstile.secret' => 'test-secret']);

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false], 200),
        ]);

        $this->postJson('/api/auth/register', $this->registration('no-token@example.com'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Bot verification failed. Please try again.');

        $this->postJson('/api/auth/register', $this->registration('bad-token@example.com') + [
            'cf-turnstile-response' => 'bogus',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'no-token@example.com']);
        $this->assertDatabaseMissing('users', ['email' => 'bad-token@example.com']);
    }

    public function test_configured_turnstile_accepts_a_valid_token(): void
    {
        config(['services.turnstile.secret' => 'test-secret']);

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true], 200),
        ]);

        $this->postJson('/api/auth/register', $this->registration('good-token@example.com') + [
            'cf-turnstile-response' => 'valid-token',
        ])->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'good-token@example.com']);
    }

    public function test_mutation_window_trips_and_reads_pass_through(): void
    {
        config(['ratelimits.mutations_per_minute' => 3]);

        $user = $this->actingAsUser();

        // Mutations share one per-actor bucket (422s still count as attempts).
        for ($i = 0; $i < 3; $i++) {
            $this->actingAs($user, 'sanctum')->postJson('/api/cart/coupon', ['code' => 'NOPE']);
        }

        $this->actingAs($user, 'sanctum')->postJson('/api/cart/coupon', ['code' => 'NOPE'])
            ->assertStatus(429)
            ->assertJsonPath('message', fn ($message) => str_contains((string) $message, 'Too many requests'));

        // Reads are on the generous buckets, unaffected by the mutation cap.
        $this->actingAs($user, 'sanctum')->getJson('/api/auth/user')->assertOk();
    }
}
