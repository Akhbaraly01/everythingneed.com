<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedMilestone;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Orders\Entities\Dispute;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;
use Tests\TestCase;

/**
 * N-21 arbitration of an escrowed milestone.
 *
 * A moderator splits the held amount: the provider award is credited, the
 * remainder is refunded to the payer, and the award can never exceed what
 * is held.
 */
class NeedArbitrationTest extends TestCase
{
    private function fundedMilestone(float $amount = 50.0): array
    {
        config(['payments.driver' => 'mock']);

        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-'.uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);

        $owner = $this->createUser();
        $provider = $this->createUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);

        $offer = NeedOffer::create([
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => 120.0,
            'message' => 'Available tomorrow.',
            'status' => NeedOffer::STATUS_ACCEPTED,
        ]);

        $this->actingAs($owner, 'sanctum');
        $milestoneId = $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen and bathroom',
            'amount' => $amount,
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertOk();

        return [$request, $offer, $owner, $provider, $milestoneId];
    }

    public function test_a_milestone_dispute_is_arbitrated_into_a_split(): void
    {
        [$request, , $owner, $provider, $milestoneId] = $this->fundedMilestone(50.0);

        // Either party can escalate a funded milestone.
        $this->actingAs($provider, 'sanctum');
        $disputeId = $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/dispute", [
            'subject' => 'Bathroom was not cleaned',
            'description' => 'The agreed scope was not delivered.',
        ])->assertStatus(201)->json('data.id');

        $this->assertDatabaseHas('disputes', [
            'id' => $disputeId,
            'need_milestone_id' => $milestoneId,
            'arbitration_status' => 'pending',
        ]);
        $this->assertEquals('disputed', NeedMilestone::find($milestoneId)->status);

        // The owner is told a dispute was opened.
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'need_disputed',
        ]);

        // A moderator splits the held amount: 60% to the provider.
        $admin = $this->actingAsAdmin();
        $this->postJson("/api/admin/needs/disputes/{$disputeId}/arbitrate", [
            'provider_percent' => 60,
            'notes' => 'Partial delivery evidenced by the workroom photos.',
        ])
            ->assertOk()
            ->assertJsonPath('data.provider_award', 30)
            ->assertJsonPath('data.buyer_refund', 20);

        $award = Payment::where('order_id', $request->id)
            ->where('purpose', 'need_arbitration_award')
            ->first();
        $this->assertNotNull($award);
        $this->assertEquals(30.0, (float) $award->amount);
        $this->assertEquals((string) $provider->id, (string) $award->user_id);

        $refund = Refund::where('payment_id', NeedMilestone::find($milestoneId)->payment_id)->first();
        $this->assertNotNull($refund);
        $this->assertEquals(20.0, (float) $refund->amount);

        $dispute = Dispute::find($disputeId);
        $this->assertEquals('resolved', $dispute->status);
        $this->assertEquals('split', $dispute->arbitration_status);
        $this->assertEquals((string) $admin->id, (string) $dispute->arbitrated_by);
    }

    public function test_an_award_never_exceeds_the_held_amount(): void
    {
        [$request, , , $provider, $milestoneId] = $this->fundedMilestone(50.0);

        $this->actingAs($provider, 'sanctum');
        $disputeId = $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/dispute", [
            'subject' => 'Full award requested',
            'description' => 'Everything was delivered.',
        ])->assertStatus(201)->json('data.id');

        $this->actingAsAdmin();
        $this->postJson("/api/admin/needs/disputes/{$disputeId}/arbitrate", [
            'provider_amount' => 999,
            'notes' => 'Award capped at the held amount.',
        ])
            ->assertOk()
            ->assertJsonPath('data.provider_award', 50)
            ->assertJsonPath('data.buyer_refund', 0);
    }

    public function test_a_resolved_dispute_cannot_be_arbitrated_twice(): void
    {
        [$request, , , $provider, $milestoneId] = $this->fundedMilestone(50.0);

        $this->actingAs($provider, 'sanctum');
        $disputeId = $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/dispute", [
            'subject' => 'Scope not met',
            'description' => 'Half the work only.',
        ])->assertStatus(201)->json('data.id');

        $this->actingAsAdmin();
        $this->postJson("/api/admin/needs/disputes/{$disputeId}/arbitrate", [
            'provider_percent' => 50,
            'notes' => 'First award.',
        ])->assertOk();

        $this->postJson("/api/admin/needs/disputes/{$disputeId}/arbitrate", [
            'provider_percent' => 90,
            'notes' => 'Second award.',
        ])->assertStatus(422);

        $this->assertEquals(
            1,
            Payment::where('order_id', $request->id)->where('purpose', 'need_arbitration_award')->count()
        );
    }

    public function test_arbitration_needs_an_escrowed_milestone(): void
    {
        $owner = $this->createUser();

        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-'.uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);

        $dispute = Dispute::create([
            'user_id' => $owner->id,
            'need_request_id' => $request->id,
            'subject' => 'Request dispute without escrow',
            'description' => 'No milestone behind this one.',
            'status' => 'open',
            'resolution' => 'none',
        ]);

        $this->actingAsAdmin();
        $this->postJson("/api/admin/needs/disputes/{$dispute->id}/arbitrate", [
            'provider_percent' => 50,
            'notes' => 'Nothing to split.',
        ])->assertStatus(422);
    }
}
