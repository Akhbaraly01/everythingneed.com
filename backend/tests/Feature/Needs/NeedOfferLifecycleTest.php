<?php

namespace Tests\Feature\Needs;

use Illuminate\Support\Facades\Artisan;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedOfferRevision;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 12 offers + quotations: quotation fields, revision history, withdraw,
 * expiry, and single-winner acceptance.
 */
class NeedOfferLifecycleTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    private function openRequest(object $owner, NeedCategory $category): string
    {
        $this->actingAs($owner, 'sanctum');

        return $this->postJson('/api/need-requests', [
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ])->assertStatus(201)->json('data.id');
    }

    public function test_quotation_fields_persist_and_revision_history_grows(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $requestId = $this->openRequest($owner, $category);

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'First draft.',
            'scope_of_work' => 'Whole flat except balcony.',
            'deliverables' => 'Clean flat, itemized checklist.',
            'estimated_duration' => '1 day',
            'terms' => 'Payment after acceptance.',
            'expires_at' => now()->addDays(7)->toIso8601String(),
        ])->assertStatus(201)->json('data.id');

        $this->assertEquals(1, NeedOfferRevision::where('need_offer_id', $offerId)->count());

        // Re-submit revises: history preserved, standing row carries latest.
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 100,
            'message' => 'Revised quote.',
        ])->assertStatus(201);

        $offer = NeedOffer::find($offerId);
        $this->assertEquals(100, (float) $offer->price);
        $this->assertEquals(2, (int) $offer->revision_no);
        $this->assertEquals(2, NeedOfferRevision::where('need_offer_id', $offerId)->count());
        $this->assertEquals(120, (float) NeedOfferRevision::where('need_offer_id', $offerId)->where('revision_no', 1)->value('price'));
    }

    public function test_provider_can_withdraw_pending_offer(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $requestId = $this->openRequest($owner, $category);

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Changed my mind.',
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/withdraw")->assertOk();
        $this->assertEquals('withdrawn', NeedOffer::find($offerId)->status);

        // Withdrawn offers can never be accepted.
        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")->assertStatus(404);

        // Strangers cannot withdraw other providers' offers.
        $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/withdraw")->assertStatus(404);
    }

    public function test_expired_offer_cannot_be_accepted(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $requestId = $this->openRequest($owner, $category);

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Slow bid.',
            'expires_at' => now()->addDay()->toIso8601String(),
        ])->assertStatus(201)->json('data.id');

        // Time passes: the quotation lapses.
        NeedOffer::find($offerId)->update(['expires_at' => now()->subMinute()]);

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'This offer has expired']);
        $this->assertEquals('expired', NeedOffer::find($offerId)->status);
    }

    public function test_expiry_sweep_closes_stale_quotations(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $requestId = $this->openRequest($owner, $category);

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Stale bid.',
            'expires_at' => now()->addDay()->toIso8601String(),
        ])->assertStatus(201)->json('data.id');

        NeedOffer::find($offerId)->update(['expires_at' => now()->subMinute()]);

        Artisan::call('needs:expire-offers');
        $this->assertEquals('expired', NeedOffer::find($offerId)->status);
    }

    public function test_only_one_offer_can_win(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $requestId = $this->openRequest($owner, $category);

        $providerA = $this->actingAsUser();
        $offerA = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Bid A.',
        ])->assertStatus(201)->json('data.id');

        $providerB = $this->actingAsUser();
        $offerB = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 100,
            'message' => 'Bid B.',
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerA}/accept")->assertOk();

        // The loser is refused: the request already left the open states, so
        // exactly one winner exists (no conflicting bookings).
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerB}/accept")->assertStatus(422);
        $this->assertEquals(1, NeedOffer::where('need_request_id', $requestId)->where('status', 'accepted')->count());
        $this->assertEquals('rejected', NeedOffer::find($offerB)->status);
    }
}
