<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

class NeedPayoutTest extends TestCase
{
    private function createCategory(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-'.uniqid(),
            'description' => 'Home cleaning',
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    /** Accepted request + accepted offer, ready for the owner to pay. */
    private function acceptedRequest(float $price = 120.0): array
    {
        $category = $this->createCategory();
        $owner = $this->createUser();
        $provider = $this->createUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean including windows.',
            'status' => NeedRequest::STATUS_ACCEPTED,
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

    public function test_full_chain_owner_charge_then_provider_payout_on_complete(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->acceptedRequest();

        // Owner pays the accepted offer (escrow charge).
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/pay", ['method' => 'card'])
            ->assertStatus(201);

        // Provider starts then completes — completion releases the payout.
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/start")->assertOk();
        $complete = $this->postJson("/api/need-requests/{$request->id}/complete");
        $complete->assertOk()->assertJsonPath('data.status', 'completed');

        // Exactly two payments for this request: owner charge + provider payout.
        $this->assertSame(2, Payment::where('order_id', $request->id)->count());

        $ownerCharge = Payment::where('order_id', $request->id)
            ->where('user_id', $owner->id)->first();
        $this->assertNotNull($ownerCharge, 'Owner charge row missing');
        $this->assertStringStartsWith('NRPAY-', $ownerCharge->reference);

        $payout = Payment::where('order_id', $request->id)
            ->where('user_id', $provider->id)->first();
        $this->assertNotNull($payout, 'Provider payout row missing');
        $this->assertStringStartsWith('NEEDPAYOUT-', $payout->reference);
        $this->assertSame('platform_escrow', $payout->method);
        $this->assertSame('succeeded', $payout->status);
        $this->assertSame(120.0, (float) $payout->amount);
        $this->assertSame('need_payout', $payout->gateway_response['kind'] ?? null);

        // Both parties are notified (completion + payout release).
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id, 'type' => 'need_completed', 'related_id' => $request->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $provider->id, 'type' => 'need_payout', 'related_id' => $request->id,
        ]);

        // Completion is not re-runnable: no duplicate payout.
        $this->postJson("/api/need-requests/{$request->id}/complete")->assertStatus(422);
        $this->assertSame(2, Payment::where('order_id', $request->id)->count());
    }

    public function test_admin_forced_completion_without_offer_issues_no_payout(): void
    {
        config(['payments.driver' => 'mock']);
        $owner = $this->createUser();
        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $this->createCategory()->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Edge case',
            'description' => 'In progress without an accepted offer.',
            'status' => NeedRequest::STATUS_IN_PROGRESS,
        ]);

        $this->actingAsAdmin();
        $this->postJson("/api/need-requests/{$request->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->assertSame(0, Payment::where('order_id', $request->id)->count());
    }

    public function test_provider_cannot_complete_before_starting_work(): void
    {
        [$request, , , $provider] = $this->acceptedRequest();

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/complete")->assertStatus(422);

        $this->assertSame(0, Payment::where('order_id', $request->id)->count());
    }
}
