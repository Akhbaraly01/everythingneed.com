<?php

namespace Tests\Feature\Experts;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Experts\Entities\ExpertBooking;
use Modules\Healthcare\Entities\Doctor;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * Spec 60: expert booking + payment (book -> pay -> confirmed), with
 * slot-clash protection, owner-only pay/cancel, and refunds.
 */
class ExpertBookingTest extends TestCase
{
    use RefreshDatabase;

    private function makeExpert(array $overrides = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Dr. '.fake()->name(),
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 75.00,
            'virtual_fee' => 60.00,
            'is_available' => true,
            'rating' => 4.2,
        ], $overrides));
    }

    private function book($user, Doctor $expert, array $overrides = []): array
    {
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/book", array_merge([
                'scheduled_date' => now()->addDays(3)->toDateString(),
                'scheduled_time' => '10:00',
                'mode' => 'virtual',
                'notes' => 'Quarterly review',
            ], $overrides))
            ->assertStatus(201);

        return $response->json('data');
    }

    public function test_booking_creates_pending_unpaid_booking_with_server_derived_fee(): void
    {
        $user = $this->createUser();
        $expert = $this->makeExpert(['consultation_fee' => 75.00]);

        $data = $this->book($user, $expert);

        $this->assertStringStartsWith('EXP-', $data['booking_number']);
        $this->assertSame('pending', $data['status']);
        $this->assertSame('unpaid', $data['payment_status']);
        $this->assertEquals(75.0, (float) $data['amount']);
    }

    public function test_clashing_slot_is_rejected(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();
        $expert = $this->makeExpert();

        $this->book($user, $expert);

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/book", [
                'scheduled_date' => now()->addDays(3)->toDateString(),
                'scheduled_time' => '10:00',
                'mode' => 'virtual',
            ])
            ->assertStatus(422);
    }

    public function test_payment_confirms_booking_without_charging_client_supplied_amount(): void
    {
        $user = $this->createUser();
        $expert = $this->makeExpert(['consultation_fee' => 75.00]);
        $data = $this->book($user, $expert);

        // A tampered amount in the body must be ignored (server derives it).
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/bookings/{$data['id']}/pay", ['method' => 'card', 'amount' => 0.01])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');

        $booking = ExpertBooking::find($data['id']);
        $this->assertEquals(75.0, (float) $booking->amount);

        $payment = Payment::find($booking->payment_id);
        $this->assertEquals(75.0, (float) $payment->amount);
        $this->assertSame('expert_booking', $payment->purpose);
    }

    public function test_stranger_cannot_pay_or_cancel_and_sees_only_their_bookings(): void
    {
        $user = $this->createUser();
        $stranger = $this->createUser();
        $expert = $this->makeExpert();
        $data = $this->book($user, $expert);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/experts/bookings/{$data['id']}/pay", ['method' => 'card'])
            ->assertStatus(403);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/experts/bookings/{$data['id']}/cancel")
            ->assertStatus(403);

        $this->actingAs($stranger, 'sanctum')
            ->getJson('/api/experts/bookings')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/experts/bookings')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_cancelling_a_paid_booking_refunds_in_full(): void
    {
        $user = $this->createUser();
        $expert = $this->makeExpert();
        $data = $this->book($user, $expert);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/bookings/{$data['id']}/pay", ['method' => 'card'])
            ->assertOk();

        $paymentId = ExpertBooking::find($data['id'])->payment_id;

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/bookings/{$data['id']}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.payment_status', 'refunded');

        $this->assertSame('refunded', Payment::find($paymentId)->status);
    }

    public function test_booking_validates_inputs(): void
    {
        $user = $this->createUser();
        $expert = $this->makeExpert();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/book", [
                'scheduled_date' => now()->subDay()->toDateString(),
                'scheduled_time' => '25:99',
                'mode' => 'teleport',
            ])
            ->assertStatus(422);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/experts/{$expert->id}/book", [])
            ->assertStatus(422);
    }

    public function test_unknown_expert_cannot_be_booked(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/experts/'.Str::uuid().'/book', [
                'scheduled_date' => now()->addDays(2)->toDateString(),
                'scheduled_time' => '09:00',
                'mode' => 'virtual',
            ])
            ->assertNotFound();
    }

    public function test_booking_requires_authentication(): void
    {
        $expert = $this->makeExpert();

        $this->postJson("/api/experts/{$expert->id}/book", [
            'scheduled_date' => now()->addDays(2)->toDateString(),
            'scheduled_time' => '09:00',
            'mode' => 'virtual',
        ])->assertUnauthorized();
    }
}
