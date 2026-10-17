<?php

namespace Tests\Feature\Jobs;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Jobs\Entities\JobPost;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console job CRUD: full edit (PUT) + guarded delete (DELETE) on
 * /api/admin/jobs/{id} for super_admin / administrator / jobs_admin.
 */
class AdminJobCrudTest extends TestCase
{
    use RefreshDatabase;

    private function makeJob(array $overrides = []): JobPost
    {
        return JobPost::create(array_merge([
            'user_id' => User::factory()->create()->id,
            'title' => 'Crud Test Role',
            'description' => 'Testing the admin console.',
            'company' => 'TestCo',
            'location' => 'Accra, Ghana',
            'job_type' => 'full_time',
            'is_active' => true,
        ], $overrides));
    }

    #[Test]
    public function test_super_admin_edits_every_field(): void
    {
        $this->actingAsAdmin();
        $job = $this->makeJob();

        $this->putJson("/api/admin/jobs/{$job->id}", [
            'title' => 'Renamed Role',
            'company' => 'NewCo',
            'location' => 'Kumasi, Ghana',
            'job_type' => 'contract',
            'salary_min' => 1000,
            'salary_max' => 2000,
            'description' => 'Updated description',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.title', 'Renamed Role')
            ->assertJsonPath('data.job_type', 'contract')
            ->assertJsonPath('data.is_active', false);

        $fresh = JobPost::findOrFail($job->id);
        $this->assertSame('NewCo', $fresh->company);
        $this->assertSame('2000.00', (string) $fresh->salary_max);
    }

    #[Test]
    public function test_toggle_only_payload_still_works(): void
    {
        $this->actingAsAdmin();
        $job = $this->makeJob();

        $this->putJson("/api/admin/jobs/{$job->id}", ['is_active' => false])
            ->assertOk();

        $this->assertFalse(JobPost::findOrFail($job->id)->is_active);
    }

    #[Test]
    public function test_empty_payload_is_rejected(): void
    {
        $this->actingAsAdmin();
        $job = $this->makeJob();

        $this->putJson("/api/admin/jobs/{$job->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_edit_404s_for_unknown_job(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/jobs/' . Str::uuid(), ['title' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_jobs_admin_role_can_edit_and_delete(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'jobs_admin');
        $this->actingAs($actor, 'sanctum');

        $job = $this->makeJob();

        $this->putJson("/api/admin/jobs/{$job->id}", ['title' => 'Jobs Admin Rename'])
            ->assertOk();

        $this->deleteJson("/api/admin/jobs/{$job->id}")->assertOk();
        $this->assertNull(JobPost::find($job->id));
    }

    #[Test]
    public function test_plain_user_cannot_edit_or_delete(): void
    {
        $job = $this->makeJob();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/admin/jobs/{$job->id}", ['title' => 'Hacked'])->assertStatus(403);
        $this->deleteJson("/api/admin/jobs/{$job->id}")->assertStatus(403);
    }

    #[Test]
    public function test_delete_soft_deletes_the_job(): void
    {
        $this->actingAsAdmin();
        $job = $this->makeJob();

        $this->deleteJson("/api/admin/jobs/{$job->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Job deleted');

        $this->assertNull(JobPost::find($job->id));
        $trashed = JobPost::withTrashed()->find($job->id);
        $this->assertNotNull($trashed);
        $this->assertNotNull($trashed->deleted_at);

        // Public reads no longer resolve it.
        $this->getJson("/api/jobs/{$job->id}")->assertStatus(404);
    }

    #[Test]
    public function test_delete_is_refused_while_applications_exist(): void
    {
        $employer = User::factory()->create();
        $seeker = User::factory()->create();

        // Create via the owner API so validation matches production flows.
        $this->actingAs($employer, 'sanctum');
        $jobId = $this->postJson('/api/jobs', [
            'title' => 'Guarded Role',
            'description' => 'Has an applicant.',
            'company' => 'GuardCo',
            'location' => 'Accra, Ghana',
            'job_type' => 'full_time',
        ])->assertStatus(201)->json('data.id');

        $this->app['auth']->forgetGuards();
        $this->actingAs($seeker, 'sanctum');
        $this->postJson("/api/jobs/{$jobId}/apply", [])->assertStatus(201);

        $this->app['auth']->forgetGuards();
        $this->actingAsAdmin();

        $this->deleteJson("/api/admin/jobs/{$jobId}")
            ->assertStatus(422);

        $this->assertNotNull(JobPost::find($jobId));
    }
}
