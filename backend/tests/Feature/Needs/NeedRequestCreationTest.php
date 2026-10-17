<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 06 guided request creation: pricing coherence, structured location,
 * timing flags, and invitation-only visibility with real enforcement.
 */
class NeedRequestCreationTest extends TestCase
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

    private function basePayload(NeedCategory $category): array
    {
        return [
            'title' => 'Deep clean 3-bedroom apartment',
            'description' => 'Full deep clean including windows.',
            'category_id' => $category->id,
        ];
    }

    public function test_pricing_basis_coherence_is_enforced(): void
    {
        $category = $this->category();
        $this->actingAsUser();

        // Fixed without an amount is meaningless.
        $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'fixed',
        ])->assertStatus(422);

        // Range needs both ends.
        $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'range',
            'budget_max' => 150,
        ])->assertStatus(422);

        // Quote/Unknown-budget modes stay budget-optional.
        $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'quote',
        ])->assertStatus(201);

        $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'range',
            'budget_min' => 80,
            'budget_max' => 150,
        ])->assertStatus(201);
    }

    public function test_creation_fields_persist(): void
    {
        $category = $this->category();
        $this->actingAsUser();

        $created = $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'hourly',
            'budget_min' => 10,
            'budget_max' => 25,
            'is_remote' => true,
            'state' => 'Lagos',
            'lga' => 'Ikeja',
            'city' => 'Ikeja GRA',
            'is_asap' => true,
            'preferred_time_window' => 'Weekdays after 5pm',
        ])->assertStatus(201);

        $request = NeedRequest::findOrFail($created->json('data.id'));
        $this->assertEquals('hourly', $request->pricing_basis);
        $this->assertTrue((bool) $request->is_remote);
        $this->assertEquals('Lagos', $request->state);
        $this->assertEquals('Ikeja', $request->lga);
        $this->assertTrue((bool) $request->is_asap);
        $this->assertEquals('Weekdays after 5pm', $request->preferred_time_window);
        $this->assertEquals('public', $request->visibility);
    }

    public function test_invite_only_requires_invitees_and_hides_from_strangers(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $invited = $this->actingAsUser();
        $stranger = $this->actingAsUser();

        // Invite-only without invitees is refused.
        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'quote',
            'visibility' => 'invite_only',
        ])->assertStatus(422);

        $created = $this->postJson('/api/need-requests', $this->basePayload($category) + [
            'pricing_basis' => 'quote',
            'visibility' => 'invite_only',
            'invited_provider_ids' => [$invited->id],
        ])->assertStatus(201);
        $requestId = $created->json('data.id');

        // Stranger: invisible in open scope, detail, and offers.
        $this->actingAs($stranger, 'sanctum');
        $this->getJson('/api/need-requests?scope=open')->assertOk()->assertJsonMissing(['id' => $requestId]);
        $this->getJson("/api/need-requests/{$requestId}")->assertStatus(403);
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 100,
            'message' => 'Let me in.',
        ])->assertStatus(403);

        // Invited provider: visible everywhere and may offer.
        $this->actingAs($invited, 'sanctum');
        $this->getJson('/api/need-requests?scope=open')->assertOk()->assertJsonFragment(['id' => $requestId]);
        $this->getJson("/api/need-requests/{$requestId}")->assertOk();
        $this->postJson("/api/need-requests/{$requestId}/offers", [
            'price' => 100,
            'message' => 'Happy to help.',
        ])->assertStatus(201);
    }
}
