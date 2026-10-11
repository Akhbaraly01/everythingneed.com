<?php

namespace Tests\Feature\WaveF;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Tests\TestCase;

/**
 * Wave F (spec S10-S14): lifecycle coverage that the pinned NeedRequest*
 * suites do not reach - drafts, negotiation, moderation transitions,
 * dispute -> refund, the timeline, and need_request review rules.
 */
class WaveFNeedsWorkflowTest extends TestCase
{
    private function createCategory(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Wave F Services',
            'slug' => 'wave-f-'.uniqid(),
            'description' => 'Wave F category',
            'icon' => 'wrench',
            'color' => '#6366F1',
        ]);
    }

    private function createNeedAs($owner, NeedCategory $category, array $overrides = []): string
    {
        $this->actingAs($owner, 'sanctum');

        return $this->postJson('/api/need-requests', array_merge([
            'title' => 'Wave F need request',
            'description' => 'A request used by the Wave F lifecycle suites.',
            'category_id' => $category->id,
            'budget_min' => 50,
            'budget_max' => 200,
            'location' => 'Testville',
        ], $overrides))->assertStatus(201)->json('data.id');
    }

    public function test_draft_can_be_saved_submitted_and_published(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();

        $id = $this->createNeedAs($owner, $category, ['save_as_draft' => true]);
        $this->assertEquals('draft', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Drafts are not in the open marketplace.
        $this->actingAs($this->createUser(), 'sanctum');
        $this->getJson('/api/need-requests?scope=open')
            ->assertOk()
            ->assertJsonMissing(['id' => $id]);

        // Draft -> submit -> publish, all owner-driven.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/submit")->assertOk();
        $this->assertEquals('pending', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        $this->postJson("/api/need-requests/{$id}/publish")->assertOk();
        $this->assertEquals('published', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Published requests appear to providers.
        $this->actingAs($this->createUser(), 'sanctum');
        $this->getJson('/api/need-requests?scope=open')->assertOk()->assertJsonFragment(['id' => $id]);

        // Submitting twice cannot happen (only drafts may be submitted).
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/submit")->assertStatus(422);
    }

    public function test_negotiation_resubmits_the_standing_offer(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $id = $this->createNeedAs($owner, $category);

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$id}/offers", ['price' => 150])
            ->assertStatus(201)->json('data.id');
        $this->assertEquals('offered', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Re-submitting the standing offer updates it and opens Negotiation.
        $this->postJson("/api/need-requests/{$id}/offers", ['price' => 120, 'message' => 'Bulk discount.'])
            ->assertStatus(201);
        $fresh = $this->getJson("/api/need-requests/{$id}")->json('data');
        $this->assertEquals('negotiating', $fresh['status']);
        $this->assertEquals(1, count($fresh['offers']));
        $this->assertEquals(120, (float) $fresh['offers'][0]['price']);

        // Owner accepts the counter and the request moves to Accepted.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers/{$offerId}/accept")->assertOk();
        $this->assertEquals('accepted', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // The accepted provider cannot re-bid.
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers", ['price' => 90])->assertStatus(422);
    }

    public function test_owner_dispute_and_moderator_refund_settle_the_money(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $provider = $this->actingAsUser();
        $id = $this->createNeedAs($owner, $category);

        $this->actingAs($provider, 'sanctum');
        $offerId = $this->postJson("/api/need-requests/{$id}/offers", ['price' => 100])
            ->assertStatus(201)->json('data.id');
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers/{$offerId}/accept")->assertOk();
        $this->postJson("/api/need-requests/{$id}/pay", ['method' => 'card'])->assertStatus(201);

        // Strangers cannot dispute; the owner can while work is underway.
        $this->actingAs($this->createUser(), 'sanctum');
        $this->postJson("/api/need-requests/{$id}/dispute")->assertStatus(403);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/dispute")->assertOk();
        $this->assertEquals('disputed', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Only a moderator may refund, and only from `disputed`.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/refund")->assertStatus(403);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $refund = $this->postJson("/api/need-requests/{$id}/refund");
        $refund->assertOk();
        $this->assertEquals('refunded', $refund->json('data.status'));

        // The NRPAY payment is really refunded through the gateway.
        $payment = \Modules\Payments\Entities\Payment::where('order_id', $id)
            ->where('reference', 'like', 'NRPAY-%')
            ->first();
        $this->assertNotNull($payment);
        $this->assertEquals(\Modules\Payments\Entities\Payment::STATUS_REFUNDED, $payment->status);

        // Refunding twice is impossible (state guard).
        $this->postJson("/api/need-requests/{$id}/refund")->assertStatus(422);
    }

    public function test_timeline_records_every_transition(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $provider = $this->actingAsUser();

        $id = $this->createNeedAs($owner, $category, ['save_as_draft' => true]);
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/submit")->assertOk();
        $this->postJson("/api/need-requests/{$id}/publish")->assertOk();

        $this->actingAs($provider, 'sanctum');
        $offerId = $this->postJson("/api/need-requests/{$id}/offers", ['price' => 75])
            ->assertStatus(201)->json('data.id');
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers/{$offerId}/accept")->assertOk();
        $this->postJson("/api/need-requests/{$id}/pay", ['method' => 'card'])->assertStatus(201);
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/start")->assertOk();
        $this->postJson("/api/need-requests/{$id}/complete")->assertOk();

        $timeline = $this->getJson("/api/need-requests/{$id}")->json('data.timeline');
        $actions = array_column($timeline, 'action');

        foreach (['create', 'submit', 'publish', 'offer', 'accept_offer', 'pay', 'start', 'complete'] as $expected) {
            $this->assertContains($expected, $actions, "Timeline is missing the '{$expected}' action.");
        }

        // Every event carries the state edge and an actor.
        foreach ($timeline as $ev) {
            $this->assertNotEmpty($ev['to_status']);
            $this->assertNotEmpty($ev['created_at']);
            $this->assertArrayHasKey('actor', $ev);
        }

        $this->assertSame(
            count($timeline),
            NeedRequestEvent::where('need_request_id', $id)->count()
        );
    }

    public function test_transition_guards_enforce_roles_and_states(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $id = $this->createNeedAs($owner, $category, ['save_as_draft' => true]);

        // Publish is impossible before submit.
        $this->postJson("/api/need-requests/{$id}/publish")->assertStatus(422);

        $this->postJson("/api/need-requests/{$id}/submit")->assertOk();

        // A stranger owns none of the actions.
        $stranger = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$id}/publish")->assertStatus(403);
        $this->postJson("/api/need-requests/{$id}/cancel")->assertStatus(403);
        $this->postJson("/api/need-requests/{$id}/reject")->assertStatus(403);
        $this->postJson("/api/need-requests/{$id}/expire")->assertStatus(403);

        // The owner cancels once, then the state no longer allows it.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/cancel")->assertOk();
        $this->assertEquals('cancelled', $this->getJson("/api/need-requests/{$id}")->json('data.status'));
        $this->postJson("/api/need-requests/{$id}/cancel")->assertStatus(422);

        // Cancelled requests close to offers.
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers", ['price' => 10])->assertStatus(422);
    }

    public function test_moderator_rejects_and_owner_expires(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();

        // Moderator rejection from a submitted request.
        $id = $this->createNeedAs($owner, $category);
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/reject")->assertOk();
        $this->assertEquals('rejected', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Owner expiration while open, then the request leaves the marketplace.
        $id2 = $this->createNeedAs($owner, $category);
        $this->postJson("/api/need-requests/{$id2}/publish")->assertOk();
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id2}/expire")->assertOk();
        $this->assertEquals('expired', $this->getJson("/api/need-requests/{$id2}")->json('data.status'));

        $this->actingAs($this->createUser(), 'sanctum');
        $open = $this->getJson('/api/need-requests?scope=open')->assertOk()->json('data');
        $openIds = array_column($open, 'id');
        $this->assertNotContains($id, $openIds);
        $this->assertNotContains($id2, $openIds);
    }

    public function test_need_request_review_rules(): void
    {
        $owner = $this->createUser();
        $category = $this->createCategory();
        $pendingId = $this->createNeedAs($owner, $category);

        // Reviewing too early and by the wrong person are both refused.
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $pendingId,
            'rating' => 5,
        ])->assertStatus(422);

        $this->actingAs($this->createUser(), 'sanctum');
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $pendingId,
            'rating' => 5,
        ])->assertStatus(403);

        // Completed flow -> the requester reviews exactly once.
        $provider = $this->createUser();
        $this->actingAs($provider, 'sanctum');
        $offerId = $this->postJson("/api/need-requests/{$pendingId}/offers", ['price' => 60])
            ->assertStatus(201)->json('data.id');
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$pendingId}/offers/{$offerId}/accept")->assertOk();
        $this->postJson("/api/need-requests/{$pendingId}/pay", ['method' => 'card'])->assertStatus(201);
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$pendingId}/start")->assertOk();
        $this->postJson("/api/need-requests/{$pendingId}/complete")->assertOk();

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $pendingId,
            'rating' => 5,
            'comment' => 'Fast and spotless.',
        ])->assertStatus(201);

        $this->postJson('/api/reviews', [
            'reviewable_type' => 'need_request',
            'reviewable_id' => $pendingId,
            'rating' => 4,
        ])->assertStatus(422);

        // The review is discoverable through the filtered index the
        // my-needs review page uses.
        $this->getJson('/api/reviews?reviewable_type=need_request&reviewable_id='.$pendingId)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['reviewable_id' => $pendingId, 'rating' => 5]);
    }

    public function test_fulfilled_state_allows_provider_delivery_then_completion(): void
    {
        $owner = $this->actingAsUser();
        $category = $this->createCategory();
        $provider = $this->actingAsUser();
        $id = $this->createNeedAs($owner, $category);

        $this->actingAs($provider, 'sanctum');
        $offerId = $this->postJson("/api/need-requests/{$id}/offers", ['price' => 90])
            ->assertStatus(201)->json('data.id');
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/offers/{$offerId}/accept")->assertOk();
        $this->postJson("/api/need-requests/{$id}/pay", ['method' => 'card'])->assertStatus(201);

        // Fulfilling before starting is refused (spec S13 order).
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$id}/fulfill")->assertStatus(422);

        $this->postJson("/api/need-requests/{$id}/start")->assertOk();
        $this->postJson("/api/need-requests/{$id}/fulfill")->assertOk();
        $this->assertEquals('fulfilled', $this->getJson("/api/need-requests/{$id}")->json('data.status'));

        // Complete from `fulfilled` is allowed; dispute stays available to
        // the provider until completion.
        $this->postJson("/api/need-requests/{$id}/complete")->assertOk();
        $this->assertEquals('completed', $this->getJson("/api/need-requests/{$id}")->json('data.status'));
        $this->postJson("/api/need-requests/{$id}/dispute")->assertStatus(422);
    }
}
