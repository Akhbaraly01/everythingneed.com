<?php

namespace Tests\Feature\Notifications;

use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * W16 (N-02): notification delivery per channel.
 *
 * Pins the three live channels: database rows (+ unread/read API),
 * realtime broadcast as best-effort (an outage never breaks notify),
 * and mail for the password-reset flow.
 */
class NotificationChannelMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_channel_persists_and_unread_api_tracks_it(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        app(NotificationServiceInterface::class)->notify(
            $user->id,
            'Matrix Title',
            'Matrix body message.',
            'order',
            (string) \Illuminate\Support\Str::uuid()
        );

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'title' => 'Matrix Title',
            'type' => 'order',
            'is_read' => false,
        ]);

        $count = $this->getJson('/api/notifications/unread-count')->assertOk()->json('data.unread');
        $this->assertSame(1, (int) $count);

        $list = $this->getJson('/api/notifications')->assertOk()->json('data');
        $this->assertNotEmpty($list);

        $this->postJson("/api/notifications/{$list[0]['id']}/read")->assertOk();
        $this->assertSame(0, (int) $this->getJson('/api/notifications/unread-count')->json('data.unread'));
    }

    public function test_realtime_outage_never_breaks_notify(): void
    {
        $user = $this->createUser();

        // Point broadcasting at a driver that does not exist: broadcast()
        // must throw inside the service's own try/catch, never to us.
        config(['broadcasting.default' => 'driver-that-does-not-exist']);

        app(NotificationServiceInterface::class)->notify(
            $user->id,
            'Outage Title',
            'Persisted despite the outage.',
            'general'
        );

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'title' => 'Outage Title',
        ]);
    }

    public function test_password_reset_sends_mail(): void
    {
        // Notification::fake captures at the dispatch layer: the password
        // broker sends Illuminate\Auth\Notifications\ResetPassword whose
        // via() is ['mail'] (Mail::fake cannot see notification-channel
        // sends because MailChannel resolves the real manager).
        Notification::fake();
        $user = $this->createUser();

        $this->post('/forgot-password', ['email' => $user->email])
            ->assertStatus(302)
            ->assertSessionHas('status');

        Notification::assertSentTo(
            $user,
            \Illuminate\Auth\Notifications\ResetPassword::class
        );
    }
}
