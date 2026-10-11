<?php

namespace Tests\Feature\Delivery;

use Tests\TestCase;

/**
 * Wave T — Delivery module had no dedicated suite: registration,
 * availability, ownership gates (self/admin/vendor_admin vs stranger),
 * completion counters, and rate math.
 */
class DeliveryLifecycleTest extends TestCase
{
    private function register(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/delivery/managers', array_merge([
            'full_name' => 'Wavet Rider',
            'phone' => '+233201234567',
            'vehicle_type' => 'motorbike',
        ], $overrides));
    }

    public function test_guest_cannot_touch_delivery(): void
    {
        $this->getJson('/api/delivery/managers')->assertStatus(401);
        $this->postJson('/api/delivery/managers', ['full_name' => 'x', 'phone' => 'x'])
            ->assertStatus(401);
    }

    public function test_manager_registration_defaults(): void
    {
        $this->actingAsUser();

        $res = $this->register()->assertStatus(201);
        $this->assertTrue($res->json('data.is_available'));
        $this->assertSame(0, $res->json('data.completed_deliveries'));
        $this->assertSame(0, (int) $res->json('data.rating'));
    }

    public function test_registration_validates(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/delivery/managers', ['full_name' => 'No phone'])
            ->assertStatus(422);
    }

    public function test_availability_and_my_deliveries(): void
    {
        $this->actingAsUser();
        $this->register()->assertStatus(201);

        $this->putJson('/api/delivery/availability', ['is_available' => false])->assertOk();

        $mine = $this->getJson('/api/delivery/my')->assertOk()->json('data');
        $this->assertFalse($mine['is_available']);
        $this->assertSame(0, $mine['completed_deliveries']);
    }

    public function test_availability_requires_a_profile(): void
    {
        $this->actingAsUser();

        $this->putJson('/api/delivery/availability', ['is_available' => true])
            ->assertStatus(404);
        $this->getJson('/api/delivery/my')->assertStatus(404);
    }

    public function test_cross_user_writes_are_denied(): void
    {
        $owner = $this->createUser();
        $this->actingAs($owner, 'sanctum');
        $id = $this->register()->assertStatus(201)->json('data.id');

        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');

        $this->putJson('/api/delivery/managers/' . $id, ['vehicle_type' => 'van'])
            ->assertStatus(403);
        $this->postJson('/api/delivery/managers/' . $id . '/deliver')->assertStatus(403);
        $this->getJson('/api/delivery/managers/' . $id)->assertStatus(403);
    }

    public function test_vendor_admin_sees_stripped_profile(): void
    {
        $owner = $this->createUser();
        $this->actingAs($owner, 'sanctum');
        $id = $this->register()->assertStatus(201)->json('data.id');

        $vendor = $this->createUser();
        $this->assignRole($vendor, 'vendor_admin');
        $this->actingAs($vendor, 'sanctum');

        $res = $this->getJson('/api/delivery/managers/' . $id)->assertOk();
        // Vendors see the public-safe profile — never the phone number.
        $this->assertArrayNotHasKey('phone', $res->json('data'));
        $this->assertSame('Wavet Rider', $res->json('data.full_name'));
    }

    public function test_self_and_admin_see_full_profile(): void
    {
        $owner = $this->createUser();
        $this->actingAs($owner, 'sanctum');
        $id = $this->register()->assertStatus(201)->json('data.id');

        $self = $this->getJson('/api/delivery/managers/' . $id)->assertOk()->json('data');
        $this->assertSame('+233201234567', $self['phone']);

        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $this->putJson('/api/delivery/managers/' . $id, ['vehicle_type' => 'van'])
            ->assertOk()
            ->assertJsonPath('data.vehicle_type', 'van');
    }

    public function test_completion_counters(): void
    {
        $this->actingAsUser();
        $id = $this->register()->assertStatus(201)->json('data.id');

        $this->postJson('/api/delivery/managers/' . $id . '/deliver')
            ->assertOk()
            ->assertJsonPath('data.outcome', 'delivered')
            ->assertJsonPath('data.completed_deliveries', 1);

        $this->postJson('/api/delivery/managers/' . $id . '/fail', ['reason' => 'Gate locked'])
            ->assertOk()
            ->assertJsonPath('data.outcome', 'failed')
            ->assertJsonPath('data.completed_deliveries', 1);
    }

    public function test_rates_math(): void
    {
        $this->actingAsUser();

        $res = $this->getJson('/api/delivery/rates?distance_km=10')->assertOk()->json('data');
        $this->assertSame(14.49, round($res['base_rate'] + $res['distance_km'] * $res['per_km_rate'], 2));
        $this->assertSame($res['estimated_total'], round($res['base_rate'] + 10 * $res['per_km_rate'], 2));

        $bare = $this->getJson('/api/delivery/rates')->assertOk()->json('data');
        $this->assertNull($bare['estimated_total']);
    }
}
