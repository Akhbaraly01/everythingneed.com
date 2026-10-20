<?php

namespace Tests\Feature\JobSeekers;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\JobSeekers\Entities\WorkRequest;
use Tests\TestCase;

class AdminJobSeekerConsoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function staff(string $role): User
    {
        $user = User::factory()->create();
        $this->assignRole($user, $role);

        return $user;
    }

    private function makeWorker(array $overrides = []): WorkerProfile
    {
        $user = User::factory()->create();

        return WorkerProfile::create(array_merge([
            'user_id' => $user->id,
            'headline' => 'Certified Electrician',
            'category' => 'Electricians',
            'city' => 'Accra',
            'availability' => 'available',
            'hourly_rate' => 20,
        ], $overrides));
    }

    public function test_jobs_admin_lists_every_profile_with_filters_and_plain_users_are_denied(): void
    {
        $verified = $this->makeWorker(['headline' => 'Verified Plumber', 'category' => 'Plumbers', 'is_verified' => true]);
        $unverified = $this->makeWorker(['headline' => 'New Tailor', 'category' => 'Tailors']);

        $admin = $this->staff('jobs_admin');
        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/job-seekers?per_page=50');
        $list->assertOk();
        $this->assertSame(2, $list->json('meta.total'));
        $ids = array_column($list->json('data'), 'id');
        $this->assertContains($verified->id, $ids);
        $this->assertContains($unverified->id, $ids);

        $filtered = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/job-seekers?verified=1');
        $filtered->assertOk();
        $this->assertSame(1, $filtered->json('meta.total'));
        $this->assertSame($verified->id, $filtered->json('data.0.id'));

        $searched = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/job-seekers?q=Tailor');
        $searched->assertOk();
        $this->assertSame($unverified->id, $searched->json('data.0.id'));

        $this->actingAs($this->createUser(), 'sanctum')
            ->getJson('/api/admin/job-seekers')->assertForbidden();
        $this->actingAs($this->staff('food_admin'), 'sanctum')
            ->getJson('/api/admin/job-seekers')->assertForbidden();
    }

    public function test_admin_toggles_verification_and_it_reaches_the_public_directory(): void
    {
        $worker = $this->makeWorker();

        $this->actingAs($this->staff('jobs_admin'), 'sanctum')
            ->putJson("/api/admin/job-seekers/{$worker->id}", ['is_verified' => true])
            ->assertOk()
            ->assertJsonPath('data.is_verified', true);

        $this->assertTrue($worker->fresh()->is_verified);
        $this->getJson('/api/job-seekers?verified_only=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($this->staff('jobs_admin'), 'sanctum')
            ->putJson("/api/admin/job-seekers/{$worker->id}", ['is_verified' => false])
            ->assertOk();

        $this->assertFalse($worker->fresh()->is_verified);

        $this->actingAs($this->staff('jobs_admin'), 'sanctum')
            ->putJson("/api/admin/job-seekers/{$worker->id}", [])
            ->assertStatus(422);

        $this->actingAs($this->staff('jobs_admin'), 'sanctum')
            ->putJson('/api/admin/job-seekers/11111111-1111-1111-1111-111111111111', ['is_verified' => true])
            ->assertNotFound();
    }

    public function test_admin_removes_and_restores_profiles_but_refuses_while_work_is_active(): void
    {
        $worker = $this->makeWorker();
        $admin = $this->staff('jobs_admin');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/job-seekers/{$worker->id}")
            ->assertOk();

        $this->assertSoftDeleted('worker_profiles', ['id' => $worker->id]);
        $this->getJson('/api/job-seekers')->assertOk()->assertJsonPath('meta.total', 0);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/job-seekers/{$worker->id}/restore")
            ->assertOk();
        $this->assertNotSoftDeleted('worker_profiles', ['id' => $worker->id]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/job-seekers/{$worker->id}/restore")
            ->assertStatus(422);

        $busy = $this->makeWorker(['headline' => 'Booked Mason']);
        WorkRequest::create([
            'requester_id' => User::factory()->create()->id,
            'worker_profile_id' => $busy->id,
            'title' => 'Ongoing build',
            'category' => 'Masons',
            'status' => 'in_progress',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/job-seekers/{$busy->id}")
            ->assertStatus(422);

        $this->assertNotSoftDeleted('worker_profiles', ['id' => $busy->id]);
    }

    public function test_admin_work_request_queue_exposes_parties_and_is_permission_gated(): void
    {
        $worker = $this->makeWorker();
        $requester = User::factory()->create(['name' => 'Ama Requester']);

        $request = WorkRequest::create([
            'requester_id' => $requester->id,
            'worker_profile_id' => $worker->id,
            'title' => 'Rewire the workshop',
            'category' => 'Electricians',
            'status' => 'open',
        ]);

        $admin = $this->staff('jobs_admin');
        $list = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/work-requests');
        $list->assertOk();
        $this->assertSame(1, $list->json('meta.total'));
        $this->assertSame('Ama Requester', $list->json('data.0.requester.name'));
        $this->assertSame($worker->id, $list->json('data.0.worker_profile.id'));

        $this->actingAs($this->staff('content_manager'), 'sanctum')
            ->getJson('/api/admin/work-requests')->assertForbidden();
        $this->actingAs($this->createUser(), 'sanctum')
            ->getJson('/api/admin/work-requests')->assertForbidden();
    }

    public function test_job_seeker_console_page_renders_for_jobs_admin_and_bounces_plain_users(): void
    {
        $admin = $this->staff('jobs_admin');

        $this->actingAs($admin, 'web')
            ->get('/admin/job-seekers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/JobSeekers'));

        $this->actingAs($this->createUser(), 'web')
            ->get('/admin/job-seekers')
            ->assertStatus(302)
            ->assertSessionHas('error');
    }
}
