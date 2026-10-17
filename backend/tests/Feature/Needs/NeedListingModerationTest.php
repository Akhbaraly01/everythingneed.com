<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Tests\TestCase;

/**
 * TODO 09 service listings: draft → review → approve → publish flow, owner
 * revision rules, and public discovery limited to eligible listings.
 */
class NeedListingModerationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
        ]);
    }

    private function submitListing(NeedCategory $category, object $owner): string
    {
        $this->actingAs($owner, 'sanctum');

        return $this->postJson('/api/need-items', [
            'name' => 'Standard Home Cleaning',
            'description' => 'Floors, kitchen, bathrooms.',
            'category_id' => $category->id,
            'price' => 45,
            'packages' => [
                ['name' => 'Basic', 'price' => 45, 'delivery_time' => '2 days'],
                ['name' => 'Deep', 'price' => 90, 'delivery_time' => '3 days'],
            ],
            'submit' => true,
        ])->assertStatus(201)->json('data.id');
    }

    public function test_listing_reaches_public_only_through_review(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $id = $this->submitListing($category, $owner);

        // Submitted: invisible everywhere public.
        $this->getJson('/api/need-items')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->getJson('/api/deals')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->getJson("/api/deals/{$id}")->assertStatus(404);

        $this->actingAsUser('needs_admin');

        // Publish skips approval: refused.
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'publish',
        ])->assertStatus(422);

        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'approve',
        ])->assertOk();
        // Approved but not yet published: still invisible.
        $this->getJson("/api/deals/{$id}")->assertStatus(404);

        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'publish',
        ])->assertOk();

        $this->getJson('/api/need-items')->assertOk()->assertJsonFragment(['id' => $id]);
        $this->getJson("/api/deals/{$id}")->assertOk()->assertJsonFragment(['id' => $id]);
    }

    public function test_reject_needs_a_reason_and_suspend_hides(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $id = $this->submitListing($category, $owner);

        $this->actingAsUser('needs_admin');

        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'reject',
        ])->assertStatus(422);

        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'reject',
            'note' => 'Price missing for the Deep package.',
        ])->assertOk();
        $this->assertEquals('rejected', NeedItem::find($id)->status);

        // Rejected → approved → published, then suspended: hides again.
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'approve'])->assertOk();
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'publish'])->assertOk();
        $this->getJson("/api/deals/{$id}")->assertOk();

        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'suspend'])->assertOk();
        $this->getJson("/api/deals/{$id}")->assertStatus(404);
    }

    public function test_owner_edit_returns_live_listing_to_review(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $id = $this->submitListing($category, $owner);

        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'approve'])->assertOk();
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'publish'])->assertOk();

        $this->actingAs($owner, 'sanctum');
        $this->putJson("/api/need-items/{$id}", ['price' => 55])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Listing returned to review']);

        $this->assertEquals('submitted', NeedItem::find($id)->status);
        $this->getJson("/api/deals/{$id}")->assertStatus(404);

        // Strangers cannot edit.
        $this->actingAsUser();
        $this->putJson("/api/need-items/{$id}", ['price' => 1])->assertStatus(403);
    }

    public function test_inactive_category_hides_its_listings(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $id = $this->submitListing($category, $owner);

        $this->actingAsUser('needs_admin');
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'approve'])->assertOk();
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", ['action' => 'publish'])->assertOk();
        $this->getJson("/api/deals/{$id}")->assertOk();

        $this->putJson("/api/admin/needs/categories/{$category->id}", [
            'is_active' => false,
        ])->assertOk();

        $this->getJson('/api/need-items')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->getJson("/api/deals/{$id}")->assertStatus(404);
    }

    public function test_inactive_category_rejects_new_listings(): void
    {
        $category = $this->category();
        $category->update(['is_active' => false]);
        $this->actingAsUser();

        $this->postJson('/api/need-items', [
            'name' => 'X',
            'category_id' => $category->id,
        ])->assertStatus(422);
    }

    public function test_customer_cannot_moderate_listings(): void
    {
        $category = $this->category();
        $owner = $this->actingAsUser();
        $id = $this->submitListing($category, $owner);

        $this->actingAsUser();
        $this->postJson("/api/admin/needs/listings/{$id}/moderate", [
            'action' => 'approve',
        ])->assertStatus(403);
    }
}
