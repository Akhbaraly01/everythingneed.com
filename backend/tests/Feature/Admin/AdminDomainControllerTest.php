<?php

namespace Tests\Feature\Admin;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Dispute;
use Modules\RealEstate\Entities\Property;
use Modules\Reviews\Entities\Review;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * AdminDomainController: 11 role-gated endpoints over the remaining real
 * tables (pharmacy orders, building bookings, disputes, refunds,
 * subscriptions, wallet transactions, notifications, properties, reviews).
 */
class AdminDomainControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    /** @return array<string, array{string}> */
    public static function readEndpoints(): array
    {
        return [
            'pharmacy orders'    => ['/api/admin/pharmacy/orders'],
            'building bookings'  => ['/api/admin/building/bookings'],
            'disputes'           => ['/api/admin/disputes'],
            'refunds'            => ['/api/admin/refunds'],
            'subscriptions'      => ['/api/admin/subscriptions'],
            'wallet transactions'=> ['/api/admin/wallet/transactions'],
            'notifications'      => ['/api/admin/notifications'],
            'properties'         => ['/api/admin/properties'],
        ];
    }

    #[DataProvider('readEndpoints')]
    public function test_domain_read_endpoint_returns_paginated_shape(string $path): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')->getJson($path)
            ->assertOk()
            ->assertJsonStructure(['data', 'total', 'meta' => ['page', 'per_page', 'total']]);
    }

    #[Test]
    public function test_plain_user_is_forbidden_from_domain_consoles(): void
    {
        $user = $this->createUser();

        foreach (['/api/admin/disputes', '/api/admin/properties', '/api/admin/refunds'] as $path) {
            $this->actingAs($user, 'sanctum')->getJson($path)->assertForbidden();
        }
    }

    #[Test]
    public function test_specialist_roles_can_reach_their_own_domain_endpoints(): void
    {
        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');
        $finance = $this->createUser();
        $this->assignRole($finance, 'finance_admin');
        $pharmacy = $this->createUser();
        $this->assignRole($pharmacy, 'pharmacy_admin');
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($moderator, 'sanctum')->getJson('/api/admin/disputes')->assertOk();
        $this->actingAs($finance, 'sanctum')->getJson('/api/admin/refunds')->assertOk();
        $this->actingAs($finance, 'sanctum')->getJson('/api/admin/wallet/transactions')->assertOk();
        $this->actingAs($pharmacy, 'sanctum')->getJson('/api/admin/pharmacy/orders')->assertOk();
        $this->actingAs($building, 'sanctum')->getJson('/api/admin/properties')->assertOk();
        $this->actingAs($building, 'sanctum')->getJson('/api/admin/building/bookings')->assertOk();
    }

    #[Test]
    public function test_dispute_decision_updates_status_resolution_and_is_audited(): void
    {
        $requester = $this->createUser();
        $dispute = Dispute::create([
            'user_id' => $requester->id,
            'subject' => 'Item not as described',
            'description' => 'Broken on arrival',
            'status' => 'open',
        ]);
        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');

        $this->actingAs($moderator, 'sanctum')->putJson("/api/admin/disputes/{$dispute->id}", [
            'status' => 'resolved',
            'resolution' => 'refund',
            'resolution_notes' => 'Refund approved after review',
        ])->assertOk();

        $this->assertDatabaseHas('disputes', [
            'id' => $dispute->id,
            'status' => 'resolved',
            'resolution' => 'refund',
            'resolution_notes' => 'Refund approved after review',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'dispute.resolved',
            'entity_type' => 'dispute',
            'entity_id' => (string) $dispute->id,
            'performed_by' => $moderator->id,
        ]);

        $queue = $this->actingAs($moderator, 'sanctum')->getJson('/api/admin/disputes?status=resolved');
        $queue->assertOk();
        $ids = array_column($queue->json('data'), 'id');
        $this->assertContains($dispute->id, $ids);
        $this->assertSame($requester->email, $queue->json('data.0.requester_email'));
    }

    #[Test]
    public function test_dispute_decision_validation_and_unknown_id(): void
    {
        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');

        $this->actingAs($moderator, 'sanctum')
            ->putJson('/api/admin/disputes/'.Str::uuid(), ['status' => 'resolved'])
            ->assertNotFound();

        $dispute = Dispute::create([
            'user_id' => $this->createUser()->id,
            'subject' => 'S',
            'description' => 'D',
            'status' => 'open',
        ]);

        $this->actingAs($moderator, 'sanctum')
            ->putJson("/api/admin/disputes/{$dispute->id}", ['status' => 'banana'])
            ->assertStatus(422);
    }

    #[Test]
    public function test_property_activation_toggle(): void
    {
        $owner = $this->createUser();
        $property = Property::create([
            'user_id' => $owner->id,
            'title' => 'Sunny Loft',
            'description' => 'Central',
            'property_type' => 'apartment',
            'price' => 250000,
            'currency' => 'USD',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'address' => '1 Main St',
            'city' => 'Lisbon',
            'country' => 'PT',
            'is_active' => true,
            'is_featured' => false,
        ]);
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($building, 'sanctum')
            ->putJson("/api/admin/properties/{$property->id}", ['is_active' => false])
            ->assertOk();

        $this->assertDatabaseHas('properties', ['id' => $property->id, 'is_active' => false]);

        $active = $this->actingAs($building, 'sanctum')->getJson('/api/admin/properties?status=active');
        $active->assertOk();
        $this->assertNotContains($property->id, array_column($active->json('data'), 'id'));

        $all = $this->actingAs($building, 'sanctum')->getJson('/api/admin/properties');
        $this->assertContains($property->id, array_column($all->json('data'), 'id'));
    }

    #[Test]
    public function test_property_toggle_unknown_id_and_validation(): void
    {
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($building, 'sanctum')
            ->putJson('/api/admin/properties/'.Str::uuid(), ['is_active' => false])
            ->assertNotFound();

        $this->actingAs($building, 'sanctum')
            ->putJson('/api/admin/properties/'.Str::uuid(), ['is_active' => 'maybe'])
            ->assertStatus(422);
    }

    #[Test]
    public function test_property_full_edit_updates_every_listing_field(): void
    {
        $owner = $this->createUser();
        $property = Property::create([
            'user_id' => $owner->id,
            'title' => 'Old Title',
            'property_type' => 'apartment',
            'price' => 100000,
            'currency' => 'USD',
            'address' => '1 Edit Street',
            'city' => 'Accra',
            'country' => 'GH',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'is_active' => true,
            'is_featured' => false,
        ]);
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($building, 'sanctum')
            ->putJson("/api/admin/properties/{$property->id}", [
                'title' => 'Renovated Duplex',
                'property_type' => 'house',
                'price' => 325000.5,
                'currency' => 'GHS',
                'city' => 'Kumasi',
                'country' => 'GH',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'is_featured' => true,
            ])
            ->assertOk();

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'title' => 'Renovated Duplex',
            'property_type' => 'house',
            'city' => 'Kumasi',
            'bedrooms' => 4,
            'bathrooms' => 3,
            'is_featured' => true,
        ]);

        // Empty payloads are rejected instead of silently no-oping.
        $this->actingAs($building, 'sanctum')
            ->putJson("/api/admin/properties/{$property->id}", [])
            ->assertStatus(422);
    }

    #[Test]
    public function test_admin_soft_deletes_a_property(): void
    {
        $owner = $this->createUser();
        $property = Property::create([
            'user_id' => $owner->id,
            'title' => 'Doomed Listing',
            'property_type' => 'land',
            'price' => 5000,
            'currency' => 'USD',
            'address' => '9 Delete Lane',
            'city' => 'Lagos',
            'country' => 'NG',
            'is_active' => true,
        ]);
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($building, 'sanctum')
            ->deleteJson("/api/admin/properties/{$property->id}")
            ->assertOk();

        $this->assertSoftDeleted('properties', ['id' => $property->id]);

        // Gone from the console listing.
        $list = $this->actingAs($building, 'sanctum')->getJson('/api/admin/properties');
        $this->assertNotContains($property->id, array_column($list->json('data'), 'id'));

        // Repeat delete is a 404, and plain users are forbidden.
        $this->actingAs($building, 'sanctum')
            ->deleteJson("/api/admin/properties/{$property->id}")
            ->assertNotFound();
        $this->actingAs($this->createUser(), 'sanctum')
            ->deleteJson("/api/admin/properties/{$property->id}")
            ->assertForbidden();
    }

    #[Test]
    public function test_building_admin_can_create_listings_without_403(): void
    {
        $building = $this->createUser();
        $this->assignRole($building, 'building_admin');

        $this->actingAs($building, 'sanctum')
            ->postJson('/api/admin/properties', [
                'title' => 'Console Created',
                'property_type' => 'apartment',
                'price' => 88000,
                'currency' => 'USD',
                'address' => '5 Console Road',
                'city' => 'Tema',
                'country' => 'GH',
            ])
            ->assertStatus(201);
    }

    #[Test]
    public function test_review_moderation_delete(): void
    {
        $author = $this->createUser();
        $review = Review::create([
            'user_id' => $author->id,
            'reviewable_type' => 'product',
            'reviewable_id' => (string) Str::uuid(),
            'rating' => 1,
            'title' => 'Spam',
            'comment' => 'spam content',
        ]);
        $moderator = $this->createUser();
        $this->assignRole($moderator, 'moderator');

        $this->actingAs($moderator, 'sanctum')
            ->deleteJson("/api/admin/reviews/{$review->id}")
            ->assertOk();

        $this->assertSoftDeleted('reviews', ['id' => $review->id]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'review.deleted',
            'entity_type' => 'review',
            'entity_id' => (string) $review->id,
            'performed_by' => $moderator->id,
        ]);

        $this->actingAs($moderator, 'sanctum')
            ->deleteJson("/api/admin/reviews/{$review->id}")
            ->assertNotFound();
    }

    #[Test]
    public function test_domain_read_endpoints_reject_invalid_filters(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/disputes?status=bogus')->assertStatus(422);
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/notifications?is_read=bogus')->assertStatus(422);
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/pharmacy/orders?status=bogus')->assertStatus(422);
    }
}
