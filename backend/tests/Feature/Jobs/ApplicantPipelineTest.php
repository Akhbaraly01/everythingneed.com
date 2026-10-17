<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * N-33 applicant pipeline: snake_case job_post on every application
 * payload (frontend contract), poster-facing applicants page, owner-only
 * access to the per-job applications list.
 */
class ApplicantPipelineTest extends TestCase
{
    use RefreshDatabase;

    private function asUser(User $user): User
    {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    /** @return array{0: User, 1: string} employer + job id */
    private function seedJobWithApplicant(): array
    {
        $employer = User::factory()->create();
        $seeker = User::factory()->create();

        $this->asUser($employer);
        $jobId = $this->postJson('/api/jobs', [
            'title' => 'Pipeline Tester',
            'description' => 'Checks applicant payloads.',
            'company' => 'WireCo',
            'location' => 'Accra, Ghana',
            'job_type' => 'full_time',
        ])->assertStatus(201)->json('data.id');

        $this->asUser($seeker);
        $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(201);

        return [$employer, $jobId];
    }

    public function test_all_application_payloads_expose_snake_case_job_post(): void
    {
        [$employer, $jobId] = $this->seedJobWithApplicant();

        $this->asUser($employer);

        $ownerList = $this->getJson("/api/jobs/{$jobId}/applications")->assertOk()->json('data');
        $this->assertNotEmpty($ownerList);
        $this->assertArrayHasKey('job_post', $ownerList[0]);
        $this->assertArrayNotHasKey('jobPost', $ownerList[0]);
        $this->assertSame('Pipeline Tester', $ownerList[0]['job_post']['title']);

        $detail = $this->getJson('/api/jobs/applications/' . $ownerList[0]['id'])->assertOk()->json('data');
        $this->assertArrayHasKey('job_post', $detail);
        $this->assertArrayNotHasKey('jobPost', $detail);

        $updated = $this->patchJson('/api/jobs/applications/' . $ownerList[0]['id'], ['status' => 'reviewed'])
            ->assertOk()->json('data');
        $this->assertArrayHasKey('job_post', $updated);
        $this->assertArrayNotHasKey('jobPost', $updated);
    }

    public function test_applicant_my_applications_payload_has_job_post(): void
    {
        [, $jobId] = $this->seedJobWithApplicant();

        $seekerId = \Modules\Jobs\Entities\JobApplication::where('job_post_id', $jobId)->value('user_id');
        $this->asUser(\App\Models\User::find($seekerId));

        $mine = $this->getJson('/api/jobs/my-applications')->assertOk()->json('data');
        $this->assertNotEmpty($mine);
        $this->assertArrayHasKey('job_post', $mine[0]);
        $this->assertArrayNotHasKey('jobPost', $mine[0]);
    }

    public function test_admin_applications_payload_has_job_post(): void
    {
        $this->seedJobWithApplicant();

        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'jobs_admin']);
        $this->asUser($admin);

        $queue = $this->getJson('/api/admin/job-applications')->assertOk()->json('data');
        $this->assertNotEmpty($queue);
        $this->assertArrayHasKey('job_post', $queue[0]);
        $this->assertArrayNotHasKey('jobPost', $queue[0]);
    }

    public function test_owner_applications_list_is_owner_only(): void
    {
        [$employer, $jobId] = $this->seedJobWithApplicant();

        $stranger = User::factory()->create();
        $this->asUser($stranger);
        $this->getJson("/api/jobs/{$jobId}/applications")->assertForbidden();

        $this->asUser($employer);
        $this->getJson("/api/jobs/{$jobId}/applications")->assertOk();
    }

    public function test_applicants_page_requires_auth(): void
    {
        $this->get('/jobs/any-id/applicants')->assertRedirectContains('/login');
    }
}
