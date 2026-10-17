<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * N-22 gig packages: choosing a tier on a deal carries the listing +
 * tier into the request, and the snapshot price is the SERVER's copy —
 * a forged client price never lands. A tier/extras the listing no
 * longer offers is refused, never silently re-priced.
 */
class GigPackageSelectionTest extends TestCase
{
    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Design ' . uniqid(),
            'slug' => 'design-' . uniqid(),
            'icon' => 'palette',
            'color' => '#8B5CF6',
            'is_active' => true,
        ]);
    }

    private function listing(NeedCategory $category, array $over = []): NeedItem
    {
        return NeedItem::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Logo design gig',
            'slug' => 'logo-' . uniqid(),
            'description' => 'Professional logo design.',
            'price' => 50,
            'is_available' => true,
            'user_id' => $this->actingAsUser()->id,
            'status' => NeedItem::STATUS_PUBLISHED,
            'packages' => [
                ['name' => 'Basic', 'price' => 50, 'delivery_time' => '3 days', 'description' => '1 concept'],
                ['name' => 'Standard', 'price' => 120, 'delivery_time' => '2 days', 'description' => '3 concepts'],
            ],
            'add_ons' => [
                ['name' => 'Source file', 'price' => 15],
            ],
        ], $over));
    }

    public function test_choosing_a_package_snapshots_server_prices_and_survives_show(): void
    {
        $category = $this->category();
        $listing = $this->listing($category);
        $owner = $this->actingAsUser();

        $res = $this->actingAs($owner, 'sanctum')->postJson('/api/need-requests', [
            'title' => 'Need a logo refreshed',
            'description' => 'Existing brand needs a cleaner mark.',
            'category_id' => $category->id,
            'budget_min' => 120,
            'budget_max' => 120,
            'pricing_basis' => 'fixed',
            'selected_listing_id' => $listing->id,
            'selected_package_index' => 1,
            'selected_add_on_indexes' => [0],
            // Forged snapshot: only whitelisted INDEXES are accepted; the
            // server resolves name/price from the listing itself.
            'selected_package' => ['name' => 'Fake tier', 'price' => 1],
        ]);
        $res->assertStatus(201);

        $id = $res->json('data.id');
        $row = NeedRequest::findOrFail($id);
        $this->assertSame((string) $listing->id, (string) $row->selected_listing_id);

        $snapshot = $row->selected_package;
        $this->assertSame('Standard', $snapshot['name']);
        $this->assertEquals(120, $snapshot['price']);
        $this->assertSame('2 days', $snapshot['delivery_time']);
        $this->assertSame(1, $snapshot['index']);
        $this->assertSame('Source file', $snapshot['add_ons'][0]['name']);
        $this->assertEquals(15, $snapshot['add_ons'][0]['price']);

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/need-requests/{$id}")
            ->assertOk()
            ->assertJsonPath('data.selected_listing_id', $listing->id)
            ->assertJsonPath('data.selected_package.name', 'Standard');
    }

    public function test_invalid_tier_listing_and_extra_choices_are_refused(): void
    {
        $category = $this->category();
        $listing = $this->listing($category);
        $owner = $this->actingAsUser();
        $base = ['title' => 'T', 'description' => 'D'];

        // A tier without its listing.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + ['selected_package_index' => 1])
            ->assertStatus(422)
            ->assertJsonPath('message', 'A package choice needs the listing it belongs to');

        // Unknown listing id (exists rule).
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + [
                'selected_listing_id' => '11111111-1111-4111-8111-111111111111',
                'selected_package_index' => 0,
            ])
            ->assertStatus(422);

        // In-range index the listing does not offer (packages: 0, 1).
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + [
                'selected_listing_id' => $listing->id,
                'selected_package_index' => 2,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'That package is no longer offered on this listing');

        // Extras without a package.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + [
                'selected_listing_id' => $listing->id,
                'selected_add_on_indexes' => [0],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Choose a package before adding extras');

        // Valid package, extra index the listing does not offer.
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + [
                'selected_listing_id' => $listing->id,
                'selected_package_index' => 0,
                'selected_add_on_indexes' => [7],
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'One of the chosen extras is no longer offered');

        // Archived/unpublished gigs cannot carry a purchase intent.
        $archived = $this->listing($category, ['status' => NeedItem::STATUS_ARCHIVED]);
        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/need-requests', $base + [
                'selected_listing_id' => $archived->id,
                'selected_package_index' => 0,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'That listing is not available for package selection');
    }

    public function test_listing_without_packages_still_links_but_snapshots_nothing(): void
    {
        $category = $this->category();
        $listing = $this->listing($category, ['packages' => null, 'add_ons' => null]);
        $owner = $this->actingAsUser();

        $res = $this->actingAs($owner, 'sanctum')->postJson('/api/need-requests', [
            'title' => 'Plain listing link',
            'description' => 'No tier chosen.',
            'selected_listing_id' => $listing->id,
        ]);
        $res->assertStatus(201);

        $row = NeedRequest::findOrFail($res->json('data.id'));
        $this->assertSame((string) $listing->id, (string) $row->selected_listing_id);
        $this->assertNull($row->selected_package);
    }
}
