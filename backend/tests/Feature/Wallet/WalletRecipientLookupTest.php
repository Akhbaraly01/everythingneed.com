<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletRecipientLookupTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_lookup_recipients(): void
    {
        $this->getJson('/api/wallet/recipients/lookup?email=a@b.com')->assertUnauthorized();
    }

    public function test_lookup_returns_minimal_recipient_fields(): void
    {
        $me = User::factory()->create();
        $friend = User::factory()->create(['email' => 'friend@example.com']);

        $this->actingAs($me, 'sanctum')
            ->getJson('/api/wallet/recipients/lookup?email=friend@example.com')
            ->assertOk()
            ->assertJsonPath('data.id', $friend->id)
            ->assertJsonPath('data.email', 'friend@example.com')
            ->assertJsonPath('data.name', $friend->name)
            ->assertJsonMissingPath('data.password');
    }

    public function test_lookup_404_for_unknown_email(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me, 'sanctum')
            ->getJson('/api/wallet/recipients/lookup?email=nobody@example.com')
            ->assertNotFound();
    }

    public function test_lookup_rejects_transfers_to_self(): void
    {
        $me = User::factory()->create(['email' => 'me@example.com']);

        $this->actingAs($me, 'sanctum')
            ->getJson('/api/wallet/recipients/lookup?email=me@example.com')
            ->assertStatus(422);
    }

    public function test_lookup_validates_email_format(): void
    {
        $me = User::factory()->create();

        $this->actingAs($me, 'sanctum')
            ->getJson('/api/wallet/recipients/lookup?email=not-an-email')
            ->assertStatus(422);
    }
}
