<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Jobs\Entities\JobApplication;
use Modules\Jobs\Entities\JobPost;
use Tests\TestCase;
use Database\Seeders\PermissionSeeder;

/**
 * W5 job-board journey: employer posts -> seeker applies (guards: own
 * post, duplicates, expired) -> employer shortlists -> hires, with the
 * admin applications queue observing.
 */
class JobApplicationJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function asUser(User $user): User
    {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function postJob(User $employer): string
    {
        $this->asUser($employer);

        return $this->postJson('/api/jobs', [
            'title' => 'Solar Installation Technician',
            'description' => 'Install residential solar systems across Tema.',
            'company' => 'VoltWorks Ltd',
            'location' => 'Tema, Ghana',
            'job_type' => 'contract',
            'salary_min' => 6000,
            'salary_max' => 9600,
            'requirements' => ['Electrical certification'],
        ])->assertStatus(201)->json('data.id');
    }

    public function test_post_apply_shortlist_hire_journey(): void
    {
        $employer = User::factory()->create();
        $seeker = User::factory()->create();

        $jobId = $this->postJob($employer);

        // Public board shows the post.
        $this->assertTrue(collect($this->getJson('/api/jobs')->assertOk()->json('data'))
            ->contains(fn ($j) => $j['id'] === $jobId));

        // Seeker applies.
        $this->asUser($seeker);
        $applicationId = $this->postJson("/api/jobs/{$jobId}/apply", [
            'cover_letter' => 'Certified electrician, ready to start.',
        ])->assertStatus(201)->json('data.id');

        $this->assertSame('pending', JobApplication::find($applicationId)->status);

        // Duplicate application rejected.
        $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(409);

        // Employer cannot apply to their own post.
        $this->asUser($employer);
        $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(422);

        // Employer shortlists then hires.
        $this->patchJson("/api/jobs/applications/{$applicationId}", ['status' => 'shortlisted'])
            ->assertOk();
        $this->patchJson("/api/jobs/applications/{$applicationId}", ['status' => 'hired'])
            ->assertOk();

        $this->assertSame('hired', JobApplication::find($applicationId)->status);

        // Seeker sees it in my-applications.
        $this->asUser($seeker);
        $mine = $this->getJson('/api/jobs/my-applications')->assertOk()->json('data');
        $this->assertTrue(collect($mine)->contains(fn ($a) => $a['id'] === $applicationId));
    }

    public function test_stranger_cannot_decide_applications(): void
    {
        $employer = User::factory()->create();
        $seeker = User::factory()->create();
        $stranger = User::factory()->create();

        $jobId = $this->postJob($employer);

        $this->asUser($seeker);
        $applicationId = $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(201)->json('data.id');

        // Stranger (not the poster) is refused.
        $this->asUser($stranger);
        $this->patchJson("/api/jobs/applications/{$applicationId}", ['status' => 'hired'])
            ->assertForbidden();
    }

    public function test_expired_posts_reject_applications(): void
    {
        $employer = User::factory()->create();
        $seeker = User::factory()->create();

        $job = JobPost::create([
            'user_id' => $employer->id,
            'title' => 'Stale Posting',
            'description' => 'Expired yesterday.',
            'company' => 'OldCo',
            'location' => 'Accra, Ghana',
            'job_type' => 'full_time',
            'is_active' => true,
            'expires_at' => now()->subDay(),
        ]);

        $this->asUser($seeker);
        $this->postJson("/api/jobs/{$job->id}/apply", [])->assertStatus(422);
    }

    public function test_admin_applications_queue_is_role_gated(): void
    {

        $this->seed(PermissionSeeder::class);        $employer = User::factory()->create();
        $seeker = User::factory()->create();
        $jobId = $this->postJob($employer);

        $this->asUser($seeker);
        $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(201);

        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'jobs_admin']);
        $this->asUser($admin);
        $queue = $this->getJson('/api/admin/job-applications')->assertOk()->json('data');
        $this->assertNotEmpty($queue);

        // Plain user is refused.
        $this->asUser($seeker);
        $this->getJson('/api/admin/job-applications')->assertForbidden();
    }
}
