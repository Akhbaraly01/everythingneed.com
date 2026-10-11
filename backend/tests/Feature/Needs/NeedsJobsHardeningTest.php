<?php

namespace Tests\Feature\Needs;

use App\Models\User;
use Modules\Jobs\Entities\JobPost;
use Modules\Needs\Entities\NeedCategory;
use Tests\TestCase;

class NeedsJobsHardeningTest extends TestCase
{
    private function createJob(User $owner, array $attrs = []): JobPost
    {
        return JobPost::create(array_merge([
            'user_id' => $owner->id,
            'title' => 'Backend Engineer',
            'description' => 'Build APIs',
            'company' => 'EN Ltd',
            'location' => 'Accra',
            'job_type' => 'full_time',
            'is_active' => true,
        ], $attrs));
    }

    public function test_guest_mine_query_does_not_crash(): void
    {
        $owner = $this->createUser();
        $this->createJob($owner);

        $this->getJson('/api/jobs?mine=1')->assertOk();
    }

    public function test_expired_jobs_excluded_from_public_list(): void
    {
        $owner = $this->createUser();
        $this->createJob($owner, ['expires_at' => now()->subDay()]);
        $active = $this->createJob($owner, ['title' => 'Active Role', 'expires_at' => now()->addDays(7)]);

        $res = $this->getJson('/api/jobs');
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Active Role', $res->json('data.0.title'));
    }

    public function test_cannot_apply_to_own_job(): void
    {
        $owner = $this->actingAsUser();
        $job = $this->createJob($owner);

        $this->postJson("/api/jobs/{$job->id}/apply", [
            'cover_letter' => 'me',
        ])->assertStatus(422);
    }

    public function test_cannot_apply_to_expired_job(): void
    {
        $owner = $this->createUser();
        $applicant = $this->actingAsUser();
        $job = $this->createJob($owner, ['expires_at' => now()->subDay()]);

        $this->postJson("/api/jobs/{$job->id}/apply")->assertStatus(422);
    }

    public function test_apply_duplicate_returns_409(): void
    {
        $owner = $this->createUser();
        $applicant = $this->actingAsUser();
        $job = $this->createJob($owner);

        $this->postJson("/api/jobs/{$job->id}/apply")->assertStatus(201);
        $this->postJson("/api/jobs/{$job->id}/apply")->assertStatus(409);
    }

    public function test_mine_list_only_returns_own_jobs(): void
    {
        $owner = $this->actingAsUser();
        $other = $this->createUser();
        $this->createJob($owner, ['title' => 'Mine']);
        $this->createJob($other, ['title' => 'Theirs']);

        $res = $this->getJson('/api/jobs?mine=1');
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Mine', $res->json('data.0.title'));
    }

    public function test_need_pay_is_idempotent_across_retries(): void
    {
        $customer = $this->actingAsUser();
        $category = NeedCategory::create([
            'name' => 'Plumbing',
            'slug' => 'plumbing-'.uniqid(),
            'description' => 'Pipes',
            'icon' => 'wrench',
            'color' => '#3B82F6',
        ]);

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Fix sink',
            'description' => 'Kitchen sink',
            'category_id' => $category->id,
        ])->json('data.id');

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 50,
        ])->json('data.id');

        $this->actingAs($customer, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")->assertOk();

        $first = $this->postJson("/api/need-requests/{$requestId}/pay", ['method' => 'card']);
        $first->assertStatus(201);

        // Second pay while already paid must be rejected by status guard
        $second = $this->postJson("/api/need-requests/{$requestId}/pay", ['method' => 'card']);
        $second->assertStatus(422);
    }

    public function test_unauthenticated_jobs_list_works(): void
    {
        $owner = $this->createUser();
        $this->createJob($owner);

        $this->getJson('/api/jobs')->assertOk();
    }
}
