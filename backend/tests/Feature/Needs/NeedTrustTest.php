<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\TaskPost;
use Modules\Orders\Entities\Dispute;
use Modules\Reviews\Entities\Review;
use Tests\TestCase;

/**
 * TODO 17 reviews + trust: task review eligibility, reporting queue,
 * provider responses, and dispute evidence.
 */
class NeedTrustTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function completedRequest(): array
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
        $owner = $this->actingAsUser();
        $provider = $this->actingAsUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean.',
            'status' => NeedRequest::STATUS_COMPLETED,
        ]);
        NeedOffer::create([
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 120,
            'message' => 'Done.',
            'status' => NeedOffer::STATUS_ACCEPTED,
        ]);

        return [$request, $owner, $provider];
    }

    public function test_task_review_requires_completion_and_owner_once(): void
    {
        $owner = $this->actingAsUser();
        $task = TaskPost::create([
            'created_by' => $owner->id,
            'post_number' => 'TSK-' . strtoupper(uniqid()),
            'title' => 'Flyers',
            'description' => 'Hand out flyers.',
            'quantity' => 100,
            'budget' => 50,
            'status' => TaskPost::STATUS_COMPLETED,
        ]);

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'task_post',
            'reviewable_id' => $task->id,
            'rating' => 5,
            'comment' => 'Great work.',
        ])->assertStatus(201);

        // Twice is refused.
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'task_post',
            'reviewable_id' => $task->id,
            'rating' => 4,
        ])->assertStatus(422);

        // Non-owners cannot review.
        $this->actingAsUser();
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'task_post',
            'reviewable_id' => $task->id,
            'rating' => 1,
        ])->assertStatus(403);
    }

    public function test_review_report_queues_and_uphold_hides(): void
    {
        [$request, $owner, $provider] = $this->completedRequest();

        $this->actingAs($owner, 'sanctum');
        $reviewId = $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $request->id,
            'rating' => 2,
            'comment' => 'Late arrival.',
        ])->assertStatus(201)->json('data.id');

        // Author cannot report their own review.
        $this->postJson("/api/reviews/{$reviewId}/report", [
            'reason' => 'Self report.',
        ])->assertStatus(422);

        // A third party reports; duplicates collapse.
        $this->actingAsUser();
        $this->postJson("/api/reviews/{$reviewId}/report", [
            'reason' => 'Contains personal data.',
        ])->assertStatus(201);
        $this->postJson("/api/reviews/{$reviewId}/report", [
            'reason' => 'Again.',
        ])->assertStatus(422);

        // Moderator upholds: review hides, report closes, all audited.
        $this->actingAsUser('moderator');
        $reports = $this->getJson('/api/admin/reviews/reports')->assertOk();
        $reportId = $reports->json('data.0.id');
        $this->assertNotEmpty($reportId);

        $this->postJson("/api/admin/reviews/reports/{$reportId}/decide", [
            'decision' => 'uphold',
        ])->assertOk();

        $this->assertEquals('hidden', Review::find($reviewId)->status);
    }

    public function test_provider_can_respond_once(): void
    {
        [$request, $owner, $provider] = $this->completedRequest();

        $this->actingAs($owner, 'sanctum');
        $reviewId = $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $request->id,
            'rating' => 3,
            'comment' => 'Okay work.',
        ])->assertStatus(201)->json('data.id');

        // Strangers cannot answer someone else's review.
        $this->actingAsUser();
        $this->postJson("/api/reviews/{$reviewId}/respond", [
            'response' => 'Hijack.',
        ])->assertStatus(403);

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/reviews/{$reviewId}/respond", [
            'response' => 'Thanks — traffic delayed us, sorry!',
        ])->assertOk();

        // Twice is refused.
        $this->postJson("/api/reviews/{$reviewId}/respond", [
            'response' => 'Again.',
        ])->assertStatus(422);

        $this->assertNotNull(Review::find($reviewId)->provider_response);
    }

    public function test_dispute_evidence_accumulates_for_parties(): void
    {
        [$request, $owner] = $this->completedRequest();

        $this->actingAs($owner, 'sanctum');
        $disputeId = $this->postJson('/api/disputes', [
            'need_request_id' => $request->id,
            'subject' => 'Quality complaint',
            'description' => 'Missed the windows.',
        ]);

        // Completed work cannot be disputed (lifecycle rule holds).
        $disputeId->assertStatus(422);

        $inProgress = NeedRequest::create([
            'user_id' => $owner->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Ongoing clean',
            'description' => 'In progress.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);
        $disputeId = $this->postJson('/api/disputes', [
            'need_request_id' => $inProgress->id,
            'subject' => 'Stalled work',
            'description' => 'No show twice.',
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/disputes/{$disputeId}/evidence", [
            'file_url' => 'https://example.com/photo.jpg',
            'note' => 'Empty house at the agreed time.',
        ])->assertStatus(201);

        $list = $this->getJson("/api/disputes/{$disputeId}/evidence")->assertOk();
        $this->assertCount(1, $list->json('data'));

        // Strangers see nothing.
        $this->actingAsUser();
        $this->getJson("/api/disputes/{$disputeId}/evidence")->assertStatus(404);
    }
}
