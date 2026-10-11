<?php

namespace Tests\Feature\Workspace;

use App\Models\User;
use App\Models\UserRole;
use Tests\TestCase;

class WorkspacePropsTest extends TestCase
{
    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    public function test_guests_receive_null_workspace(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('workspace', null));
    }

    public function test_plain_user_gets_marketplace_only_workspace(): void
    {
        $user = $this->userWithRole('user');

        $this->actingAs($user, 'web')
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('workspace.current', 'marketplace')
                ->where('workspace.available', ['marketplace'])
                ->where('workspace.landing', '/dashboard')
                ->where('workspace.adminHrefs', []));
    }

    public function test_admin_user_gets_admin_workspace_and_role_scoped_hrefs(): void
    {
        $user = $this->userWithRole('super_admin');

        $this->actingAs($user, 'web')
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('workspace.current', 'marketplace')
                ->where('workspace.available', ['marketplace', 'admin'])
                ->where('workspace.landing', '/admin/dashboard')
                // where(key, closure) hands the value as a Collection for arrays.
                ->where('workspace.adminHrefs', fn ($hrefs) => collect($hrefs)->contains('/admin/users')));
    }

    public function test_current_workspace_is_admin_on_admin_pages(): void
    {
        $user = $this->userWithRole('administrator');

        $this->actingAs($user, 'web')
            ->get('/admin/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('workspace.current', 'admin')
                ->where('workspace.available', ['marketplace', 'admin']));
    }

    public function test_multi_role_user_exposes_both_workspaces(): void
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => 'user']);
        UserRole::create(['user_id' => $user->id, 'role' => 'worker']);

        $this->actingAs($user, 'web')
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('workspace.available', ['marketplace', 'provider'])
                ->where('workspace.landing', '/provider'));
    }
}
