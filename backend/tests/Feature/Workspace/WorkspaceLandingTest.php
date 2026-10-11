<?php

namespace Tests\Feature\Workspace;

use App\Models\User;
use App\Models\UserRole;
use Tests\TestCase;

class WorkspaceLandingTest extends TestCase
{
    private function userWithRole(string $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    public function test_authenticated_root_redirects_admin_to_console(): void
    {
        $user = $this->userWithRole('super_admin');

        $this->actingAs($user, 'web')
            ->get('/')
            ->assertRedirect('/admin/dashboard');
    }

    public function test_authenticated_root_renders_home_for_customer(): void
    {
        $user = $this->userWithRole('user');

        // Approved Wave D decision: `/` renders Home for guests and
        // marketplace customers; only console roles get redirected.
        $this->actingAs($user, 'web')
            ->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Home/Index'));
    }

    public function test_authenticated_root_redirects_worker_to_provider_console(): void
    {
        $user = $this->userWithRole('worker');

        $this->actingAs($user, 'web')
            ->get('/')
            ->assertRedirect('/provider');
    }

    public function test_authenticated_root_redirects_vendor_to_portal(): void
    {
        $user = $this->userWithRole('vendor_admin');

        $this->actingAs($user, 'web')
            ->get('/')
            ->assertRedirect('/vendor');
    }

    public function test_intended_admin_url_survives_login(): void
    {
        $user = $this->userWithRole('super_admin', [
            'password' => bcrypt('password'),
        ]);

        // Guest hits an admin URL first: the role middleware stores the
        // intended destination (url.intended) and redirects to login.
        $this->get('/admin/dashboard')->assertRedirect(route('login'));

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(url('/admin/dashboard'));
    }

    public function test_guest_requesting_admin_url_is_sent_to_login(): void
    {
        $this->get('/admin/dashboard')
            ->assertRedirect(route('login'));
    }

    public function test_worker_is_denied_admin_console(): void
    {
        $user = $this->userWithRole('worker');

        // Authenticated web denials bounce to the user's own workspace with
        // an error flash (never back onto the forbidden URL itself).
        $this->actingAs($user, 'web')
            ->get('/admin/dashboard')
            ->assertRedirect('/provider')
            ->assertSessionHas('error');
    }

    public function test_worker_can_open_provider_console(): void
    {
        $user = $this->userWithRole('worker');

        $this->actingAs($user, 'web')
            ->get('/provider')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('provider/Dashboard'));
    }

    public function test_plain_user_is_denied_provider_console(): void
    {
        $user = $this->userWithRole('user');

        $this->actingAs($user, 'web')
            ->get('/provider')
            ->assertRedirect('/dashboard')
            ->assertSessionHas('error');
    }

    public function test_admin_console_root_and_dashboard_resolve_to_same_page(): void
    {
        $user = $this->userWithRole('administrator');

        $this->actingAs($user, 'web')
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Dashboard'));

        $this->actingAs($user, 'web')
            ->get('/admin/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/Dashboard'));
    }
}
