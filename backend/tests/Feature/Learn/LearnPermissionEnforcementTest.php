<?php

namespace Tests\Feature\Learn;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Spec 2682: learn admin surfaces must enforce granular learn.* permissions,
 * not role names alone. These tests pin BOTH layers:
 *   - role gate (route role: list) fails first for unknown roles, and
 *   - permission gate fails for a role in the list whose grant was never
 *     seeded / was revoked (the case a pure role gate would wrongly allow).
 */
class LearnPermissionEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private function seedMatrix(): void
    {
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
        Cache::forget('rbac.catalog');
    }

    private function revoke(string $role, string $permission): void
    {
        DB::table('role_permissions')
            ->where('role', $role)
            ->where('permission', $permission)
            ->update(['state' => 'revoked']);
        Cache::forget('rbac.matrix');
    }

    private function userWithRole(string $role): User
    {
        $user = $this->createUser();
        $this->assignRole($user, $role);

        return $user;
    }

    public function test_review_queue_denies_a_reviewer_whose_permission_was_never_seeded(): void
    {
        $reviewer = $this->userWithRole('learning_reviewer');

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/learn/posts-queue')
            ->assertStatus(403);
    }

    public function test_review_queue_allows_the_reviewer_once_the_matrix_is_seeded(): void
    {
        $this->seedMatrix();
        $reviewer = $this->userWithRole('learning_reviewer');

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/learn/posts-queue')
            ->assertOk();
    }

    public function test_review_queue_denies_a_reviewer_whose_grant_was_revoked(): void
    {
        $this->seedMatrix();
        $this->revoke('learning_reviewer', 'learn.posts.review');
        $reviewer = $this->userWithRole('learning_reviewer');

        $this->actingAs($reviewer, 'sanctum')
            ->getJson('/api/learn/posts-queue')
            ->assertStatus(403);
    }

    public function test_moderator_holds_the_review_permission_and_reaches_the_queue(): void
    {
        $this->seedMatrix();
        $moderator = $this->userWithRole('moderator');

        $this->actingAs($moderator, 'sanctum')
            ->getJson('/api/learn/posts-queue')
            ->assertOk();

        $this->actingAs($moderator, 'sanctum')
            ->getJson('/api/learn/reports')
            ->assertOk();
    }

    public function test_course_creation_denies_a_senior_role_whose_create_grant_was_revoked(): void
    {
        $this->seedMatrix();
        $this->revoke('learning_admin', 'learn.courses.create');
        $admin = $this->userWithRole('learning_admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/courses', ['title' => 'Should not create'])
            ->assertStatus(403);
    }

    public function test_course_creation_denies_a_role_that_holds_the_permission_but_not_the_route_role(): void
    {
        $this->seedMatrix();
        // content_manager holds every learn.* in the MATRIX but is not on the
        // create route's role: list - the role layer must still refuse.
        $manager = $this->userWithRole('content_manager');

        $this->actingAs($manager, 'sanctum')
            ->postJson('/api/admin/courses', ['title' => 'Should not create'])
            ->assertStatus(403);
    }

    public function test_review_page_requires_the_permission_on_the_web_console(): void
    {
        $this->seedMatrix();
        $reviewer = $this->userWithRole('learning_reviewer');

        $this->actingAs($reviewer, 'web')
            ->get('/admin/learning/review')
            ->assertOk();

        $this->revoke('learning_reviewer', 'learn.posts.review');

        $this->actingAs($reviewer, 'web')
            ->get('/admin/learning/review')
            ->assertRedirect()
            ->assertSessionHas('error');
    }
}
