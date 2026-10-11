<?php

namespace Tests\Feature\RealEstate;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Wave T — RealEstate module had no dedicated suite (WaveP covered admin
 * creation only): listing validation, my-listings scoping, inquiries, and
 * guest gates.
 */
class PropertyLifecycleTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Wavet Sky Loft',
            'property_type' => 'apartment',
            'price' => 250000,
            'address' => '3 Test Way',
            'city' => 'Testville',
            'country' => 'Testland',
        ], $overrides);
    }

    public function test_guest_cannot_mutate_properties(): void
    {
        $this->postJson('/api/properties', $this->payload())->assertStatus(401);
        $this->postJson('/api/properties/some-id/inquiries', [])->assertStatus(401);
    }

    public function test_listing_validates_property_type(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/properties', $this->payload(['property_type' => 'castle']))
            ->assertStatus(422);
        $this->postJson('/api/properties', $this->payload(['price' => -5]))
            ->assertStatus(422);
    }

    public function test_my_listings_are_owner_scoped(): void
    {
        $alice = $this->createUser();
        $this->actingAs($alice, 'sanctum');
        $id = $this->postJson('/api/properties', $this->payload())
            ->assertStatus(201)
            ->json('data.id');

        $mine = $this->getJson('/api/properties/my-listings')->assertOk()->json('data');
        $this->assertContains($id, collect($mine)->pluck('id')->all());

        $bob = $this->createUser();
        $this->actingAs($bob, 'sanctum');
        $theirs = $this->getJson('/api/properties/my-listings')->assertOk()->json('data');
        $this->assertNotContains($id, collect($theirs)->pluck('id')->all());

        // ...but the active listing is publicly visible.
        $this->assertSame($id, $this->getJson('/api/properties/' . $id)->assertOk()->json('data.id'));
    }

    public function test_inquiry_creates_a_viewing_request(): void
    {
        $owner = $this->createUser();
        $this->actingAs($owner, 'sanctum');
        $id = $this->postJson('/api/properties', $this->payload())
            ->assertStatus(201)
            ->json('data.id');

        $asker = $this->createUser();
        $this->actingAs($asker, 'sanctum');

        $rowId = $this->postJson('/api/properties/' . $id . '/inquiries', [
            'name' => 'Asker',
            'email' => 'asker@example.com',
            'phone' => '+233201234567',
            'message' => 'Can I view on Friday?',
        ])->assertStatus(201)->json('data.id');

        $row = DB::table('viewing_requests')->where('id', $rowId)->first();
        $this->assertSame($id, (string) $row->property_id);
        $this->assertSame($asker->id, (string) $row->user_id);
        $this->assertSame('pending', $row->status);
    }

    public function test_inquiry_validates_and_404s(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/properties/' . (string) \Illuminate\Support\Str::uuid() . '/inquiries', [
            'name' => 'Asker',
            'email' => 'not-an-email',
            'phone' => 'x',
            'message' => 'Hi',
        ])->assertStatus(422);

        $this->postJson('/api/properties/' . (string) \Illuminate\Support\Str::uuid() . '/viewing-requests', [
            'name' => 'Asker',
            'email' => 'asker@example.com',
            'phone' => 'x',
            'message' => 'Hi',
        ])->assertStatus(404);
    }
}
