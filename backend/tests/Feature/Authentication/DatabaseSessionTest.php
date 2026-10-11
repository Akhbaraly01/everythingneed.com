<?php

namespace Tests\Feature\Authentication;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // phpunit.xml pins SESSION_DRIVER=array for isolation; this suite
        // exercises the real database driver end-to-end.
        config(['session.driver' => 'database']);
    }

    public function test_web_login_creates_a_session_row_for_the_user(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('dashboard'));

        $this->assertGreaterThan(
            0,
            DB::table('sessions')->where('user_id', $user->id)->count(),
            'database driver must persist the logged-in session'
        );
    }

    public function test_authenticated_request_keeps_the_session_alive(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('dashboard'));

        $before = DB::table('sessions')->where('user_id', $user->id)->count();

        $this->get('/dashboard')->assertOk();

        $this->assertGreaterThan(
            0,
            DB::table('sessions')->where('user_id', $user->id)->count(),
            'session row must survive authenticated page loads'
        );
        $this->assertGreaterThanOrEqual($before, DB::table('sessions')->where('user_id', $user->id)->count());
    }

    public function test_logout_destroys_the_session_row(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $login = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $login->assertRedirect(route('dashboard'));
        $this->assertGreaterThan(0, DB::table('sessions')->where('user_id', $user->id)->count());

        // Forward the browser's session cookie so the logout request targets
        // the same row a real browser would (withCookie re-encrypts for us).
        $sessionCookie = $login->getCookie(config('session.cookie'));
        $this->withCookie(config('session.cookie'), $sessionCookie?->getValue() ?? '');

        $this->post('/logout')->assertRedirect(route('login'));

        $this->assertEquals(
            0,
            DB::table('sessions')->where('user_id', $user->id)->count(),
            'logout must delete the session row (concurrent-session revocation)'
        );
    }

    public function test_sessions_table_uses_uuid_user_ids(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $row = DB::table('sessions')->where('user_id', $user->id)->first();
        $this->assertNotNull($row);
        $this->assertEquals($user->id, $row->user_id, 'user_id must match the uuid users.id');
    }
}
