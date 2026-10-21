<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedMilestone;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;
use Tests\TestCase;

/**
 * N-20 milestone escrow ledger.
 *
 * The money rules under test: the plan never exceeds the agreed price, a
 * milestone is funded once, released once, and refunded once - a replay
 * can never move money twice.
 */
class NeedMilestoneEscrowTest extends TestCase
{
    private function requestWithAcceptedOffer(float $price = 120.0): array
    {
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
            'description' => 'Full deep clean including windows.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);

        $offer = NeedOffer::create([
            'need_request_id' => $request->id,
            'provider_id' => $provider->id,
            'price' => $price,
            'message' => 'Available tomorrow.',
            'status' => NeedOffer::STATUS_ACCEPTED,
        ]);

        return [$request, $offer, $owner, $provider];
    }

    public function test_owner_plans_milestones_and_the_plan_is_capped_by_the_agreed_price(): void
    {
        [$request, , $owner] = $this->requestWithAcceptedOffer(120.0);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen and bathroom',
            'amount' => 50,
        ])->assertStatus(201)->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('need_milestones', [
            'need_request_id' => $request->id,
            'title' => 'Kitchen and bathroom',
            'amount' => 50,
            'status' => 'pending',
        ]);

        // The plan may never promise more than the agreed price.
        $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'The whole flat',
            'amount' => 100,
        ])->assertStatus(422);

        // Strangers never see the ledger.
        $this->actingAsUser();
        $this->getJson("/api/need-requests/{$request->id}/milestones")->assertStatus(403);

        $this->actingAs($owner, 'sanctum');
        $this->getJson("/api/need-requests/{$request->id}/milestones")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_funding_holds_the_money_and_release_pays_the_provider(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->requestWithAcceptedOffer(120.0);

        $this->actingAs($owner, 'sanctum');
        $milestoneId = $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen and bathroom',
            'amount' => 50,
        ])->assertStatus(201)->json('data.id');

        // Funding charges the owner; the platform holds the money.
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")
            ->assertOk()
            ->assertJsonPath('data.status', 'funded');

        $funding = Payment::where('order_id', $request->id)
            ->where('purpose', 'need_milestone_fund')
            ->first();
        $this->assertNotNull($funding);
        $this->assertEquals(50.0, (float) $funding->amount);
        $this->assertEquals((string) $owner->id, (string) $funding->user_id);

        // Releasing credits the provider.
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/release")
            ->assertOk()
            ->assertJsonPath('data.status', 'released');

        $release = Payment::where('order_id', $request->id)
            ->where('purpose', 'need_milestone_release')
            ->first();
        $this->assertNotNull($release);
        $this->assertEquals(50.0, (float) $release->amount);
        $this->assertEquals((string) $provider->id, (string) $release->user_id);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id,
            'type' => 'need_milestone_released',
        ]);
    }

    public function test_a_milestone_can_be_funded_once_and_released_once(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner] = $this->requestWithAcceptedOffer(120.0);

        $this->actingAs($owner, 'sanctum');
        $milestoneId = $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen',
            'amount' => 50,
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertOk();

        // Replaying the funding is refused, and no second charge exists.
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertStatus(422);
        $this->assertEquals(
            1,
            Payment::where('order_id', $request->id)->where('purpose', 'need_milestone_fund')->count()
        );

        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/release")->assertOk();

        // Replaying the release is refused, and the provider is paid once.
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/release")->assertStatus(422);
        $this->assertEquals(
            1,
            Payment::where('order_id', $request->id)->where('purpose', 'need_milestone_release')->count()
        );
    }

    public function test_only_the_owner_can_fund_or_release(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->requestWithAcceptedOffer(120.0);

        $this->actingAs($owner, 'sanctum');
        $milestoneId = $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen',
            'amount' => 50,
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertStatus(403);
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/release")->assertStatus(403);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertOk();
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/release")->assertOk();
    }

    public function test_a_funded_milestone_can_be_refunded_to_the_payer(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner] = $this->requestWithAcceptedOffer(120.0);

        $this->actingAs($owner, 'sanctum');
        $milestoneId = $this->postJson("/api/need-requests/{$request->id}/milestones", [
            'title' => 'Kitchen',
            'amount' => 50,
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/fund")->assertOk();

        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/refund")
            ->assertOk()
            ->assertJsonPath('data.status', 'refunded');

        $this->assertEquals(
            1,
            Refund::where('payment_id', NeedMilestone::find($milestoneId)->payment_id)->count()
        );

        // A settled milestone cannot be refunded again.
        $this->postJson("/api/need-requests/{$request->id}/milestones/{$milestoneId}/refund")->assertStatus(422);
    }
}
