<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedScopeChange;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * TODO 15 fulfillment: progress narration, deliverable submission, owner
 * acceptance with payout, and agreed scope changes that move the money.
 */
class NeedFulfillmentTest extends TestCase
{
    /** Request in progress with an accepted offer (models, no ceremony). */
    private function inProgressRequest(float $price = 120.0): array
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
        $owner = $this->createUser();
        $provider = $this->createUser();

        $request = NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
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

    public function test_provider_posts_progress_and_owner_is_notified(): void
    {
        [$request, , $owner, $provider] = $this->inProgressRequest();

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/progress", [
            'note' => 'Half the rooms done, on schedule.',
            'evidence_url' => 'https://example.com/halfway.jpg',
        ])->assertOk();

        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'progress',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $owner->id,
            'type' => 'need_progress',
        ]);

        // Strangers and owners cannot narrate provider work.
        $this->actingAsUser();
        $this->postJson("/api/need-requests/{$request->id}/progress", [
            'note' => 'Hijack.',
        ])->assertStatus(403);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/progress", [
            'note' => 'Owner narration.',
        ])->assertStatus(403);
    }

    public function test_fulfill_carries_deliverables_and_owner_accepts(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->inProgressRequest();

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/fulfill", [
            'completion_note' => 'All rooms cleaned per checklist.',
            'evidence_url' => 'https://example.com/done.jpg',
        ])->assertOk();
        $this->assertEquals('fulfilled', $request->fresh()->status);

        // Provider cannot accept their own delivery.
        $this->postJson("/api/need-requests/{$request->id}/accept")->assertStatus(403);

        // Owner acceptance completes and releases the offer amount.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/accept")->assertOk();
        $this->assertEquals('completed', $request->fresh()->status);

        $payout = Payment::where('order_id', $request->id)
            ->where('reference', 'like', 'NEEDPAYOUT-%')
            ->first();
        $this->assertNotNull($payout);
        $this->assertEquals(120.0, (float) $payout->amount);
    }

    public function test_scope_change_moves_agreed_price_with_audit(): void
    {
        config(['payments.driver' => 'mock']);
        [$request, , $owner, $provider] = $this->inProgressRequest();

        // Provider proposes extra work for extra pay.
        $this->actingAs($provider, 'sanctum');
        $changeId = $this->postJson("/api/need-requests/{$request->id}/scope-changes", [
            'summary' => 'Balcony deep clean added at owner request.',
            'price_effect' => 40,
            'time_effect' => '+1 day',
        ])->assertStatus(201)->json('data.id');

        $this->assertNull($request->fresh()->agreed_price_override);

        // Proposer cannot decide their own change.
        $this->postJson("/api/need-scope-changes/{$changeId}/accept")->assertStatus(403);

        // Owner accepts: agreed price moves, history preserved.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-scope-changes/{$changeId}/accept")->assertOk();
        $this->assertEquals(40.0, (float) $request->fresh()->agreed_price_override);
        $this->assertEquals('accepted', NeedScopeChange::find($changeId)->status);
        $this->assertDatabaseHas('need_request_events', [
            'need_request_id' => $request->id,
            'action' => 'scope_accepted',
        ]);

        // Fulfill → owner accepts → payout follows the AGREED figure.
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/fulfill")->assertOk();
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$request->id}/accept")->assertOk();

        $payout = Payment::where('order_id', $request->id)
            ->where('reference', 'like', 'NEEDPAYOUT-%')
            ->first();
        $this->assertEquals(40.0, (float) $payout->amount);
        // The offer row itself was never rewritten.
        $this->assertEquals(120.0, (float) $request->fresh()->acceptedOffer->price);
    }

    public function test_scope_reject_and_closed_work_guard(): void
    {
        [$request, , $owner, $provider] = $this->inProgressRequest();

        $this->actingAs($owner, 'sanctum');
        $changeId = $this->postJson("/api/need-requests/{$request->id}/scope-changes", [
            'summary' => 'Add garage cleaning.',
            'price_effect' => 25,
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-scope-changes/{$changeId}/reject")->assertOk();
        $this->assertEquals('rejected', NeedScopeChange::find($changeId)->status);
        $this->assertNull($request->fresh()->agreed_price_override);

        // Decided twice: refused.
        $this->postJson("/api/need-scope-changes/{$changeId}/accept")->assertStatus(422);
    }
}
