<?php

namespace Tests\Feature\Needs;

use Tests\TestCase;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;

class NeedRequestWorkflowTest extends TestCase
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

    public function test_full_need_request_lifecycle(): void
    {
        $category = $this->createCategory();
        $customer = $this->actingAsUser();

        // 1. Customer submits a request
        $created = $this->postJson('/api/need-requests', [
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
            'budget_min' => 80,
            'budget_max' => 150,
            'location' => 'Downtown',
        ]);

        $created->assertStatus(201)
            ->assertJsonStructure(['message', 'data' => ['id', 'request_number', 'status']]);

        $requestId = $created->json('data.id');
        $this->assertEquals('pending', $created->json('data.status'));

        // 2. Provider browses open requests and bids
        $provider = $this->actingAsUser();

        $openList = $this->getJson('/api/need-requests?scope=open');
        $openList->assertOk()
            ->assertJsonFragment(['id' => $requestId]);

        $offerRes = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 120,
            'message' => 'Available tomorrow, includes supplies.',
        ]);
        $offerRes->assertStatus(201);
        $offerId = $offerRes->json('data.id');

        // Provider cannot bid on their own request (guard via owner attempt later)

        // 3. Customer sees the offer and accepts it
        $this->actingAs($customer, 'sanctum');

        $offers = $this->getJson("/api/need-requests/{$requestId}/offers");
        $offers->assertOk()->assertJsonCount(1);

        $accept = $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept");
        $accept->assertOk();
        $this->assertEquals('accepted', $accept->json('data.request.status'));

        // 4. Pay — server enforces the accepted offer amount
        $pay = $this->postJson("/api/need-requests/{$requestId}/pay", ['method' => 'card']);
        $pay->assertStatus(201);
        $this->assertEquals(120.00, (float) $pay->json('data.amount'));
        $this->assertEquals('paid', $pay->json('data.request_status'));

        // Double-pay is rejected
        $this->postJson("/api/need-requests/{$requestId}/pay")
            ->assertStatus(422);

        // 5. Provider starts then completes
        $this->actingAs($provider, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/start")->assertOk();

        $complete = $this->postJson("/api/need-requests/{$requestId}/complete");
        $complete->assertOk();
        $this->assertEquals('completed', $complete->json('data.status'));
    }

    public function test_owner_cannot_bid_on_own_request(): void
    {
        $customer = $this->actingAsUser();
        $category = $this->createCategory();

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Fix leaking tap',
            'description' => 'Kitchen tap drips constantly',
            'category_id' => $category->id,
        ])->json('data.id');

        $this->postJson("/api/need-requests/{$requestId}/offers", ['price' => 20])
            ->assertStatus(422);
    }

    public function test_stranger_cannot_view_offers_of_others_request(): void
    {
        $customer = $this->createUser();
        $category = $this->createCategory();

        $requestId = NeedRequest::create([
            'user_id' => $customer->id,
            'category_id' => $category->id,
            'request_number' => 'NR-'.uniqid(),
            'title' => 'Move furniture',
            'description' => 'Two sofas to another flat',
            'status' => 'pending',
        ])->id;

        $stranger = $this->actingAsUser();

        $this->getJson("/api/need-requests/{$requestId}/offers")
            ->assertStatus(403);
    }

    public function test_payment_requires_accepted_offer(): void
    {
        $customer = $this->actingAsUser();
        $category = $this->createCategory();

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Paint a fence',
            'description' => 'Garden fence, white paint',
            'category_id' => $category->id,
        ])->json('data.id');

        $this->postJson("/api/need-requests/{$requestId}/pay")
            ->assertStatus(422);
    }

    public function test_owner_can_reject_offer(): void
    {
        $category = $this->createCategory();
        $customer = $this->actingAsUser();

        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Garden tidy up',
            'description' => 'Mow and weed a small lawn',
            'category_id' => $category->id,
        ])->json('data.id');

        $provider = $this->actingAsUser();
        $offerId = $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 40,
            'message' => 'I can do this today.',
        ])->json('data.id');

        $this->actingAs($customer, 'sanctum');
        $reject = $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/reject");
        $reject->assertOk();
        $this->assertEquals('rejected', $reject->json('data.offer.status'));
        $this->assertEquals('reviewing', $reject->json('data.request.status'));

        // Rejected offer cannot be accepted
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/accept")
            ->assertStatus(404);

        // Stranger cannot reject
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->postJson("/api/need-requests/{$requestId}/offers/{$offerId}/reject")
            ->assertStatus(404);
    }
}
