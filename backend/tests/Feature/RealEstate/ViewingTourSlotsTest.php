<?php

namespace Tests\Feature\RealEstate;

use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * N-43 viewing tour slots: time slots on inquiries, owner approve/
 * reject workflow, slot-conflict protection, requester status list.
 */
class ViewingTourSlotsTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Tour Slot Loft',
            'property_type' => 'apartment',
            'price' => 250000,
            'address' => '7 Slot Way',
            'city' => 'Slotville',
            'country' => 'Slotland',
        ], $overrides);
    }

    private function makeListing(object $owner): string
    {
        $this->actingAs($owner, 'sanctum');

        return $this->postJson('/api/properties', $this->payload())
            ->assertStatus(201)
            ->json('data.id');
    }

    private function makeRequest(string $propertyId, object $asker, array $over = []): string
    {
        $this->actingAs($asker, 'sanctum');

        return $this->postJson('/api/properties/' . $propertyId . '/inquiries', array_merge([
            'name' => 'Asker',
            'email' => 'asker@example.com',
            'phone' => '+233201234567',
            'message' => 'Tour please',
            'viewing_date' => now()->addDays(2)->toDateString(),
            'viewing_time' => '14:00',
        ], $over))->assertStatus(201)->json('data.id');
    }

    public function test_inquiry_accepts_a_time_slot(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);

        $asker = $this->createUser();
        $rowId = $this->makeRequest($propertyId, $asker);

        $row = \DB::table('viewing_requests')->find($rowId);
        $this->assertSame('14:00', substr((string) $row->viewing_time, 0, 5));
        $this->assertNotNull($row->viewing_date);
    }

    public function test_past_viewing_date_is_rejected(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);

        $asker = $this->createUser();
        $this->actingAs($asker, 'sanctum');

        $this->postJson('/api/properties/' . $propertyId . '/inquiries', [
            'name' => 'Asker',
            'email' => 'asker@example.com',
            'phone' => '+233201234567',
            'message' => 'Yesterday tour',
            'viewing_date' => now()->subDay()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors(['viewing_date']);
    }

    public function test_owner_lists_and_approves_a_request(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);
        $asker = $this->createUser();
        $rowId = $this->makeRequest($propertyId, $asker);

        $this->actingAs($owner, 'sanctum');
        $this->getJson('/api/properties/' . $propertyId . '/viewing-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->postJson('/api/viewing-requests/' . $rowId . '/approve')
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_non_owner_cannot_list_or_approve(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);
        $asker = $this->createUser();
        $rowId = $this->makeRequest($propertyId, $asker);

        $stranger = $this->actingAsUser();
        $this->getJson('/api/properties/' . $propertyId . '/viewing-requests')->assertStatus(403);
        $this->postJson('/api/viewing-requests/' . $rowId . '/approve')->assertStatus(403);
        $this->postJson('/api/viewing-requests/' . $rowId . '/reject')->assertStatus(403);
    }

    public function test_slot_conflict_blocks_second_approval(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);

        $first = $this->createUser();
        $second = $this->createUser();
        $rowA = $this->makeRequest($propertyId, $first);
        $rowB = $this->makeRequest($propertyId, $second); // same date+time

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/viewing-requests/' . $rowA . '/approve')->assertOk();
        $this->postJson('/api/viewing-requests/' . $rowB . '/approve')->assertStatus(409);
    }

    public function test_different_slots_do_not_conflict(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);

        $first = $this->createUser();
        $second = $this->createUser();
        $rowA = $this->makeRequest($propertyId, $first, ['viewing_time' => '10:00']);
        $rowB = $this->makeRequest($propertyId, $second, ['viewing_time' => '15:00']);

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/viewing-requests/' . $rowA . '/approve')->assertOk();
        $this->postJson('/api/viewing-requests/' . $rowB . '/approve')->assertOk();
    }

    public function test_reject_flow_and_double_action_guards(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);
        $asker = $this->createUser();
        $rowId = $this->makeRequest($propertyId, $asker);

        $this->actingAs($owner, 'sanctum');
        $this->postJson('/api/viewing-requests/' . $rowId . '/reject')
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        // Rejected requests cannot be approved afterwards.
        $this->postJson('/api/viewing-requests/' . $rowId . '/approve')->assertStatus(422);
        $this->postJson('/api/viewing-requests/' . $rowId . '/reject')->assertStatus(422);
    }

    public function test_requester_sees_their_own_viewings(): void
    {
        $owner = $this->createUser();
        $propertyId = $this->makeListing($owner);
        $asker = $this->createUser();
        $this->makeRequest($propertyId, $asker);

        $this->actingAs($asker, 'sanctum');
        $this->getJson('/api/my-viewing-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $stranger = $this->actingAsUser();
        $this->getJson('/api/my-viewing-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_unknown_viewing_id_404s(): void
    {
        $this->actingAsUser();
        $missing = (string) Str::uuid();
        $this->postJson('/api/viewing-requests/' . $missing . '/approve')->assertStatus(404);
        $this->postJson('/api/viewing-requests/' . $missing . '/reject')->assertStatus(404);
    }
}
