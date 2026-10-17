<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 18 customer workspace: duplicate-as-draft, visibility management,
 * and saved listings/searches.
 */
class NeedWorkspaceTest extends TestCase
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

    private function ownRequest(object $owner, array $over = []): NeedRequest
    {
        return NeedRequest::create(array_merge([
            'user_id' => $owner->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'Deep clean apartment',
            'description' => 'Full deep clean.',
            'budget_min' => 80,
            'budget_max' => 150,
            'status' => NeedRequest::STATUS_COMPLETED,
        ], $over));
    }

    public function test_duplicate_creates_a_fresh_draft_without_history(): void
    {
        $owner = $this->actingAsUser();
        $source = $this->ownRequest($owner);

        $copyId = $this->postJson("/api/need-requests/{$source->id}/duplicate")
            ->assertStatus(201)->json('data.id');

        $copy = NeedRequest::findOrFail($copyId);
        $this->assertEquals('draft', $copy->status);
        $this->assertEquals($source->title, $copy->title);
        $this->assertEquals(150, (float) $copy->budget_max);
        $this->assertNotEquals($source->request_number, $copy->request_number);
        $this->assertNull($copy->client_key);

        // Strangers cannot clone.
        $this->actingAsUser();
        $this->postJson("/api/need-requests/{$source->id}/duplicate")->assertStatus(403);
    }

    public function test_visibility_toggle_with_invitee_rules(): void
    {
        $owner = $this->actingAsUser();
        $invited = $this->actingAsUser();
        $source = $this->ownRequest($owner, [
            'status' => NeedRequest::STATUS_PUBLISHED,
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => [$invited->id],
        ]);

        $this->actingAs($owner, 'sanctum');

        // Going public always works and clears the circle.
        $this->postJson("/api/need-requests/{$source->id}/visibility", [
            'visibility' => 'public',
        ])->assertOk();
        $this->assertEquals('public', $source->fresh()->visibility);

        // Back to invite-only without invitees: refused.
        $this->postJson("/api/need-requests/{$source->id}/visibility", [
            'visibility' => 'invite_only',
        ])->assertStatus(422);

        // With invitees: works.
        $this->postJson("/api/need-requests/{$source->id}/visibility", [
            'visibility' => 'invite_only',
            'invited_provider_ids' => [$invited->id],
        ])->assertOk();

        // Closed work freezes visibility.
        $source->update(['status' => NeedRequest::STATUS_COMPLETED]);
        $this->postJson("/api/need-requests/{$source->id}/visibility", [
            'visibility' => 'public',
        ])->assertStatus(422);
    }

    public function test_saved_listings_and_searches(): void
    {
        $category = $this->category();
        $user = $this->actingAsUser();

        $live = NeedItem::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'name' => 'Standard clean',
            'status' => NeedItem::STATUS_PUBLISHED,
            'is_available' => true,
        ]);
        $draft = NeedItem::create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'name' => 'Hidden clean',
            'status' => NeedItem::STATUS_DRAFT,
            'is_available' => true,
        ]);

        // Unpublished listings cannot be saved (no bypass via saves).
        $this->postJson('/api/needs/saved', [
            'item_type' => 'listing',
            'item_id' => $draft->id,
        ])->assertStatus(404);

        $savedId = $this->postJson('/api/needs/saved', [
            'item_type' => 'listing',
            'item_id' => $live->id,
        ])->assertStatus(201)->json('data.id');

        // Re-saving is idempotent, not a duplicate row.
        $again = $this->postJson('/api/needs/saved', [
            'item_type' => 'listing',
            'item_id' => $live->id,
        ])->assertStatus(201)->json('data.id');
        $this->assertEquals($savedId, $again);

        // Saved searches persist their query.
        $this->postJson('/api/needs/saved', [
            'item_type' => 'search',
            'query' => ['q' => 'plumber', 'state' => 'Lagos'],
        ])->assertStatus(201);

        $list = $this->getJson('/api/needs/saved')->assertOk();
        $this->assertCount(2, $list->json('data'));

        $this->deleteJson("/api/needs/saved/{$savedId}")->assertOk();
        $this->assertCount(1, $this->getJson('/api/needs/saved')->json('data'));

        // Strangers cannot remove others' saves.
        $this->actingAsUser();
        $this->deleteJson("/api/needs/saved/{$savedId}")->assertStatus(404);
    }
}
