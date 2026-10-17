<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 19 provider workspace: offers, work, and listings are strictly
 * self-scoped — no cross-provider leakage.
 */
class NeedProviderWorkspaceTest extends TestCase
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

    public function test_my_offers_lists_only_mine(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $this->actingAs($owner, 'sanctum');
        $requestId = $this->postJson('/api/need-requests', [
            'title' => 'Clean',
            'description' => 'D',
            'category_id' => $category->id,
            'pricing_basis' => 'quote',
        ])->json('data.id');

        $providerA = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 100,
            'message' => 'A bids.',
        ])->assertStatus(201);

        $providerB = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 90,
            'message' => 'B bids.',
        ])->assertStatus(201);

        $mine = $this->getJson('/api/my-offers')->assertOk();
        $this->assertCount(1, $mine->json('data'));
        $this->assertEquals('B bids.', $mine->json('data.0.message'));

        $this->actingAs($providerA, 'sanctum');
        $mineA = $this->getJson('/api/my-offers')->assertOk();
        $this->assertEquals('A bids.', $mineA->json('data.0.message'));
    }

    public function test_my_work_lists_only_accepted_assignments(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();

        $mkRequest = function () use ($owner, $category) {
            $this->actingAs($owner, 'sanctum');

            return $this->postJson('/api/need-requests', [
                'title' => 'Clean',
                'description' => 'D',
                'category_id' => $category->id,
                'pricing_basis' => 'quote',
            ])->json('data.id');
        };

        $requestA = $mkRequest();
        $requestB = $mkRequest();

        $providerA = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestA}/offers", [
            'price' => 100,
            'message' => 'A.',
        ])->assertStatus(201);

        $providerB = $this->actingAsUser();
        $this->postJson("/api/need-requests/{$requestB}/offers", [
            'price' => 100,
            'message' => 'B.',
        ])->assertStatus(201);

        // Owner accepts B's offer only.
        $this->actingAs($owner, 'sanctum');
        $offerB = NeedRequest::find($requestB)->offers()->value('id');
        $this->postJson("/api/need-requests/{$requestB}/offers/{$offerB}/accept")->assertOk();

        $this->actingAs($providerB, 'sanctum');
        $work = $this->getJson('/api/my-work')->assertOk();
        $this->assertCount(1, $work->json('data'));
        $this->assertEquals($requestB, $work->json('data.0.id'));

        $this->actingAs($providerA, 'sanctum');
        $this->assertCount(0, $this->getJson('/api/my-work')->json('data'));
    }

    public function test_my_listings_lists_only_mine_with_states(): void
    {
        $category = $this->category();
        $me = $this->actingAsUser();

        $this->postJson('/api/need-items', [
            'name' => 'My package',
            'category_id' => $category->id,
            'price' => 45,
        ])->assertStatus(201);

        $other = $this->actingAsUser();
        $this->postJson('/api/need-items', [
            'name' => 'Their package',
            'category_id' => $category->id,
            'price' => 60,
        ])->assertStatus(201);

        $this->actingAs($me, 'sanctum');
        $mine = $this->getJson('/api/my-listings')->assertOk();
        $this->assertCount(1, $mine->json('data'));
        $this->assertEquals('My package', $mine->json('data.0.name'));
        $this->assertEquals('draft', $mine->json('data.0.status'));
    }

    public function test_provider_hub_and_profile_pages_render(): void
    {
        $user = $this->actingAsUser();

        $this->actingAs($user, 'web')->get('/provider/needs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('provider/NeedsHub'));

        $this->actingAs($user, 'web')->get('/provider/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('provider/Profile'));
    }

    public function test_provider_pages_require_login(): void
    {
        $this->get('/provider/needs')->assertRedirect(route('login'));
        $this->get('/provider/profile')->assertRedirect(route('login'));
    }
}
