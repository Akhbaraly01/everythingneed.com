<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_receives_verification_notification_on_demand(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();

        $this->actingAs($user, 'web')
            ->post('/email/verification-notification');

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_signed_link_marks_email_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $notification = new VerifyEmail();
        $url = call_user_func(function () use ($notification, $user) {
            // Build the signed URL exactly as the framework notification does.
            $method = new \ReflectionMethod($notification, 'verificationUrl');
            \Illuminate\Support\Facades\URL::forceRootUrl('http://127.0.0.1:8000');

            return $method->invoke($notification, $user);
        });

        $path = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);

        $this->actingAs($user, 'web')
            ->get($path.'?'.$query)
            ->assertRedirect('/dashboard?verified=1');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_already_verified_user_short_circuits(): void
    {
        Notification::fake();

        $user = User::factory()->create(); // verified

        $this->actingAs($user, 'web')
            ->post('/email/verification-notification');

        Notification::assertNothingSentTo($user);
    }
}
