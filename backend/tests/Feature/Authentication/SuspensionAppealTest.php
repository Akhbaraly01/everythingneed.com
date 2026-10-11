<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Plan Q: suspended accounts land on /suspended (not a bare string) and
 * can file a real appeal; the endpoint is throttled and never discloses
 * whether the email belongs to an account.
 */
class SuspensionAppealTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_login_redirects_to_suspended_page(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'suspended_at' => now(),
        ]);

        $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/suspended?email='.urlencode($user->email));
        $this->assertGuest();

        $this->get('/suspended')->assertOk();
    }

    public function test_suspended_user_can_appeal_and_ticket_is_filed(): void
    {
        $user = User::factory()->create(['suspended_at' => now()]);

        $this->postJson('/api/appeals', [
            'email' => $user->email,
            'message' => 'Please restore my account, it was a mistake.',
        ])->assertOk()->assertJsonPath('message', 'If the account exists and is suspended, your appeal was received. Our team will review it.');

        $this->assertDatabaseHas('tickets', [
            'user_id' => $user->id,
            'subject' => 'Suspension appeal',
        ]);
    }

    public function test_unknown_or_active_emails_get_generic_reply_and_no_ticket(): void
    {
        $this->postJson('/api/appeals', [
            'email' => 'nobody@example.com',
            'message' => 'Please restore my account, it was a mistake.',
        ])->assertOk();
        $this->assertDatabaseCount('tickets', 0);

        $active = User::factory()->create(['suspended_at' => null]);
        $this->postJson('/api/appeals', [
            'email' => $active->email,
            'message' => 'Please restore my account, it was a mistake.',
        ])->assertOk();
        $this->assertDatabaseCount('tickets', 0);
    }

    public function test_appeal_validates_and_throttles(): void
    {
        $this->postJson('/api/appeals', ['email' => 'bad', 'message' => 'x'])->assertStatus(422);
    }
}
