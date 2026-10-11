<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\LabBooking;
use Modules\Healthcare\Entities\LabTest;
use Tests\TestCase;

class LabDomainTest extends TestCase
{
    use RefreshDatabase;

    private function makeTest(array $attributes = []): LabTest
    {
        static $i = 0;
        $i++;

        return LabTest::create(array_merge([
            'name' => "Lab Test {$i}",
            'slug' => "lab-test-{$i}",
            'description' => 'A diagnostic lab test.',
            'category' => 'Chemistry',
            'price' => 25,
            'preparation_instructions' => 'Fast 8 hours beforehand.',
            'result_time_hours' => 24,
            'is_active' => true,
        ], $attributes));
    }

    public function test_public_catalog_lists_active_tests_with_prep_and_turnaround(): void
    {
        $this->makeTest(['name' => 'CBC']);
        $this->makeTest(['name' => 'Lipid Panel', 'is_active' => false]);

        $res = $this->getJson('/api/health/labs');
        $res->assertOk();
        $data = $res->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('CBC', $data[0]['name']);
        $this->assertSame('Fast 8 hours beforehand.', $data[0]['preparation_instructions']);
        $this->assertSame(24, $data[0]['result_time_hours']);
    }

    public function test_search_filters_by_name(): void
    {
        $this->makeTest(['name' => 'Vitamin D']);
        $this->makeTest(['name' => 'A1C']);

        $res = $this->getJson('/api/health/labs?search=vitamin');
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('Vitamin D', $res->json('data.0.name'));
    }

    public function test_show_returns_404_for_unknown_or_inactive(): void
    {
        $inactive = $this->makeTest(['is_active' => false]);

        $this->getJson('/api/health/labs/does-not-exist')->assertNotFound();
        $this->getJson("/api/health/labs/{$inactive->id}")->assertNotFound();
    }

    public function test_guest_cannot_book(): void
    {
        $test = $this->makeTest();

        $this->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'appointment_time' => '10:00',
        ])->assertUnauthorized();
    }

    public function test_booking_creates_pending_record_with_test_price(): void
    {
        $user = $this->createUser();
        $test = $this->makeTest(['price' => 40]);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'appointment_time' => '10:00',
            'notes' => 'Please call before.',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('lab_bookings', [
            'patient_id' => $user->id,
            'lab_test_id' => $test->id,
            'status' => LabBooking::STATUS_PENDING,
            'is_paid' => false,
        ]);
        $this->assertSame('40.00', (string) $res->json('data.price'));
    }

    public function test_booking_rejects_past_date_and_double_booking(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();
        $test = $this->makeTest();
        $date = now()->addDays(2)->format('Y-m-d');

        $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => now()->subDay()->format('Y-m-d'),
            'appointment_time' => '09:00',
        ])->assertStatus(422);

        $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
        ])->assertCreated();

        $this->actingAs($other, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
        ])->assertStatus(422);
    }

    public function test_pay_confirms_and_is_idempotent(): void
    {
        $user = $this->createUser();
        $test = $this->makeTest(['price' => 35]);
        $booking = LabBooking::create([
            'patient_id' => $user->id,
            'lab_test_id' => $test->id,
            'booking_number' => 'LB-TEST-1',
            'appointment_date' => now()->addDays(3)->format('Y-m-d'),
            'appointment_time' => '11:00',
            'price' => 35,
            'status' => LabBooking::STATUS_PENDING,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/health/labs/bookings/{$booking->id}/pay", ['method' => 'wallet'])
            ->assertOk()
            ->assertJsonPath('data.status', LabBooking::STATUS_CONFIRMED)
            ->assertJsonPath('data.is_paid', true);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/health/labs/bookings/{$booking->id}/pay", ['method' => 'wallet'])
            ->assertOk()
            ->assertJsonPath('data.status', LabBooking::STATUS_CONFIRMED);
    }

    public function test_history_is_owner_scoped(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();
        $test = $this->makeTest();
        $booking = LabBooking::create([
            'patient_id' => $user->id,
            'lab_test_id' => $test->id,
            'booking_number' => 'LB-TEST-2',
            'appointment_date' => now()->addDays(1)->format('Y-m-d'),
            'appointment_time' => '12:00',
            'price' => 25,
            'status' => LabBooking::STATUS_CONFIRMED,
        ]);

        $this->actingAs($user, 'sanctum')->getJson('/api/health/labs/bookings')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($other, 'sanctum')->getJson("/api/health/labs/bookings/{$booking->id}")
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')->getJson("/api/health/labs/bookings/{$booking->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $booking->id);
    }

    public function test_cancel_frees_the_slot_for_rebooking(): void
    {
        $user = $this->createUser();
        $test = $this->makeTest();
        $date = now()->addDays(4)->format('Y-m-d');

        $first = $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => $date,
            'appointment_time' => '08:00',
        ])->assertCreated()->json('data.id');

        $this->actingAs($user, 'sanctum')->postJson("/api/health/labs/bookings/{$first}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', LabBooking::STATUS_CANCELLED);

        // The partial unique index excludes cancelled rows, so the slot is free.
        $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => $date,
            'appointment_time' => '08:00',
        ])->assertCreated();
    }

    public function test_inactive_test_cannot_be_booked(): void
    {
        $user = $this->createUser();
        $test = $this->makeTest(['is_active' => false]);

        $this->actingAs($user, 'sanctum')->postJson('/api/health/labs/book', [
            'lab_test_id' => $test->id,
            'appointment_date' => now()->addDay()->format('Y-m-d'),
            'appointment_time' => '09:00',
        ])->assertStatus(422);
    }

    public function test_admin_catalog_lists_inactive_tests_too(): void
    {
        $admin = $this->createAdmin();
        $this->makeTest(['name' => 'Active Panel']);
        $this->makeTest(['name' => 'Retired Panel', 'is_active' => false]);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/healthcare/labs');
        $res->assertOk();
        $this->assertCount(2, $res->json('data'));
    }

    public function test_admin_can_create_update_and_toggle_a_lab_test(): void
    {
        $admin = $this->createAdmin();

        $created = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/healthcare/labs', [
            'name' => 'Thyroid Panel',
            'category' => 'Chemistry',
            'price' => 45,
            'result_time_hours' => 48,
            'preparation_instructions' => 'Fast 12 hours.',
        ]);
        $created->assertCreated();
        $id = $created->json('data.id');
        $this->assertStringStartsWith('thyroid-panel-', (string) $created->json('data.slug'));
        $this->assertTrue((bool) $created->json('data.is_active'));

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/healthcare/labs/{$id}", [
            'is_active' => false,
            'price' => 50,
        ])->assertOk()
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.price', '50.00');

        // Deactivated tests disappear from the public catalog but stay in the admin list.
        $this->getJson('/api/health/labs')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/healthcare/labs')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_non_admin_cannot_manage_lab_tests(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')->getJson('/api/admin/healthcare/labs')->assertForbidden();
        $this->actingAs($user, 'sanctum')->postJson('/api/admin/healthcare/labs', [
            'name' => 'Nope', 'category' => 'x', 'price' => 1, 'result_time_hours' => 1,
        ])->assertForbidden();
    }

    public function test_admin_bookings_overview_lists_across_patients_and_filters_by_status(): void
    {
        $admin = $this->createAdmin();
        $userA = $this->createUser();
        $userB = $this->createUser();
        $test = $this->makeTest();

        LabBooking::create([
            'patient_id' => $userA->id, 'lab_test_id' => $test->id, 'booking_number' => 'LB-A1',
            'appointment_date' => now()->addDay()->format('Y-m-d'), 'appointment_time' => '09:00',
            'price' => 25, 'status' => LabBooking::STATUS_PENDING,
        ]);
        LabBooking::create([
            'patient_id' => $userB->id, 'lab_test_id' => $test->id, 'booking_number' => 'LB-B1',
            'appointment_date' => now()->addDay()->format('Y-m-d'), 'appointment_time' => '10:00',
            'price' => 25, 'status' => LabBooking::STATUS_CONFIRMED,
        ]);

        $all = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/healthcare/labs/bookings');
        $all->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame('LB-A1', $all->json('data.0.booking_number'));
        $this->assertSame($userA->name, $all->json('data.0.patient.name'));

        $pending = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/healthcare/labs/bookings?status=pending');
        $pending->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.booking_number', 'LB-A1');
    }
}
