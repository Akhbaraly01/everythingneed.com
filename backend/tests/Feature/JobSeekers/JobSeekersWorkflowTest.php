<?php

namespace Tests\Feature\JobSeekers;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\JobSeekers\Entities\WorkerProfile;
use Tests\TestCase;

class JobSeekersWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_worker_can_create_profile_and_appear_in_directory(): void
    {
        $worker = User::factory()->create();

        $create = $this->actingAs($worker)->postJson('/api/job-seekers/profile', [
            'headline' => 'Certified Electrician',
            'category' => 'Electricians',
            'bio' => 'Wiring specialist.',
            'hourly_rate' => 20,
            'city' => 'Accra',
            'skills' => [['name' => 'Wiring', 'level' => 'expert']],
        ]);

        $create->assertStatus(201);
        $profileId = $create->json('data.id');

        $duplicate = $this->actingAs($worker)->postJson('/api/job-seekers/profile', [
            'headline' => 'Second profile',
            'category' => 'Electricians',
        ]);
        $duplicate->assertStatus(409);

        $list = $this->getJson('/api/job-seekers?category=Electricians&q=Electrician');
        $list->assertStatus(200);
        $this->assertEquals(1, $list->json('meta.total'));
        $this->assertEquals($profileId, $list->json('data.0.id'));

        $show = $this->getJson("/api/job-seekers/{$profileId}");
        $show->assertStatus(200);
        $this->assertEquals('Certified Electrician', $show->json('data.headline'));
    }

    public function test_profile_validation_rejects_bad_category_and_rate(): void
    {
        $worker = User::factory()->create();

        $response = $this->actingAs($worker)->postJson('/api/job-seekers/profile', [
            'headline' => 'X',
            'category' => str_repeat('a', 90),
            'hourly_rate' => -5,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['category', 'hourly_rate']);
    }

    public function test_complete_work_request_lifecycle_from_open_to_rated(): void
    {
        $requester = User::factory()->create();
        $workerUser = User::factory()->create();

        $profile = WorkerProfile::create([
            'user_id' => $workerUser->id,
            'headline' => 'Plumber',
            'category' => 'Plumbers',
            'hourly_rate' => 15,
            'availability' => 'available',
            'city' => 'Accra',
        ]);

        // 1. Requester creates a request targeting the worker
        $created = $this->actingAs($requester)->postJson('/api/work-requests', [
            'worker_profile_id' => $profile->id,
            'title' => 'Fix kitchen leak',
            'description' => 'Pipe under sink leaking.',
            'category' => 'Plumbers',
            'location' => 'East Legon, Accra',
            'budget_min' => 30,
            'budget_max' => 80,
        ]);
        $created->assertStatus(201);
        $requestId = $created->json('data.id');

        // 2. Worker sees it in incoming and submits an offer
        $incoming = $this->actingAs($workerUser)->getJson('/api/work-requests/incoming');
        $incoming->assertStatus(200);
        $this->assertEquals(1, $incoming->json('meta.total'));

        $offer = $this->actingAs($workerUser)->postJson("/api/work-requests/{$requestId}/offers", [
            'rate' => 55,
            'message' => 'Can come tomorrow morning.',
        ]);
        $offer->assertStatus(201);
        $offerId = $offer->json('data.id');

        // Status moved to negotiating
        $afterOffer = $this->actingAs($requester)->getJson("/api/work-requests/{$requestId}");
        $this->assertEquals('negotiating', $afterOffer->json('data.status'));

        // 3. Requester accepts the offer
        $accept = $this->actingAs($requester)
            ->postJson("/api/work-offers/{$offerId}/respond", ['decision' => 'accept']);
        $accept->assertStatus(200);
        $this->assertEquals('accepted', $accept->json('data.work_request.status'));
        $this->assertEquals(55, $accept->json('data.work_request.agreed_rate'));

        // 4. Lifecycle transitions with role enforcement
        $this->actingAs($requester)->postJson("/api/work-requests/{$requestId}/pay")
            ->assertStatus(200);

        $forbiddenStart = $this->actingAs($requester)
            ->postJson("/api/work-requests/{$requestId}/start");
        $forbiddenStart->assertStatus(403);

        $this->actingAs($workerUser)->postJson("/api/work-requests/{$requestId}/start")
            ->assertStatus(200);

        $this->actingAs($workerUser)->postJson("/api/work-requests/{$requestId}/complete")
            ->assertStatus(200);

        // 5. Rating updates aggregates exactly once
        $rate = $this->actingAs($requester)
            ->postJson("/api/work-requests/{$requestId}/rate", [
                'rating' => 5,
                'comment' => 'Excellent work.',
            ]);
        $rate->assertStatus(200);
        $this->assertEquals(1, $rate->json('data.worker_rating_count'));
        $this->assertEquals(5.0, (float) $rate->json('data.worker_rating_avg'));

        $doubleRate = $this->actingAs($requester)
            ->postJson("/api/work-requests/{$requestId}/rate", ['rating' => 1]);
        $doubleRate->assertStatus(409);

        $freshProfile = $profile->fresh();
        $this->assertEquals(1, $freshProfile->completed_jobs);
    }

    public function test_requester_cannot_cancel_after_acceptance(): void
    {
        $requester = User::factory()->create();
        $workerUser = User::factory()->create();

        $profile = WorkerProfile::create([
            'user_id' => $workerUser->id,
            'headline' => 'Cleaner',
            'category' => 'Domestic Staff',
        ]);

        $created = $this->actingAs($requester)->postJson('/api/work-requests', [
            'worker_profile_id' => $profile->id,
            'title' => 'Weekend cleaning',
            'category' => 'Domestic Staff',
        ])->assertStatus(201);

        $requestId = $created->json('data.id');

        $cancelOpen = $this->actingAs($requester)
            ->postJson("/api/work-requests/{$requestId}/cancel");
        $cancelOpen->assertStatus(200);

        $recreate = $this->actingAs($requester)->postJson('/api/work-requests', [
            'worker_profile_id' => $profile->id,
            'title' => 'Second cleaning',
            'category' => 'Domestic Staff',
        ])->assertStatus(201);

        $secondId = $recreate->json('data.id');
        $offerId = $this->actingAs($workerUser)
            ->postJson("/api/work-requests/{$secondId}/offers", ['rate' => 25])
            ->json('data.id');

        $this->actingAs($requester)
            ->postJson("/api/work-offers/{$offerId}/respond", ['decision' => 'accept'])
            ->assertStatus(200);

        $cancelAccepted = $this->actingAs($requester)
            ->postJson("/api/work-requests/{$secondId}/cancel");
        $cancelAccepted->assertStatus(422);
    }

    public function test_private_request_details_are_hidden_from_third_parties(): void
    {
        $requester = User::factory()->create();
        $workerUser = User::factory()->create();
        $stranger = User::factory()->create();

        $profile = WorkerProfile::create([
            'user_id' => $workerUser->id,
            'headline' => 'Developer',
            'category' => 'Technology',
        ]);

        $created = $this->actingAs($requester)->postJson('/api/work-requests', [
            'worker_profile_id' => $profile->id,
            'title' => 'Build dashboard',
            'category' => 'Technology',
            'status' => null,
        ])->assertStatus(201);

        $requestId = $created->json('data.id');

        // Move to negotiating so the request is not publicly open
        $offerId = $this->actingAs($workerUser)
            ->postJson("/api/work-requests/{$requestId}/offers", ['rate' => 100])
            ->json('data.id');

        $peek = $this->actingAs($stranger)->getJson("/api/work-requests/{$requestId}");
        $peek->assertStatus(403);
    }
}
