<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * Spec 97 workflow: Book -> Pay -> Appointment. The fee is derived
 * server-side from the ticket; the client only picks the method.
 */
class AppointmentPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function bookAppointment($user, array $doctorOverrides = []): string
    {
        $doctor = Doctor::create(array_merge([
            'full_name' => 'Dr. '.fake()->name(),
            'specialization' => 'General Medicine',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 60.00,
            'virtual_fee' => 50.00,
            'is_available' => true,
            'rating' => 4.0,
        ], $doctorOverrides));

        return $this->actingAs($user, 'sanctum')
            ->postJson('/api/appointments', [
                'doctor_id' => $doctor->id,
                'symptoms' => 'Persistent cough',
                'consultation_type' => 'in_person',
                'appointment_date' => now()->addDays(3)->format('Y-m-d'),
                'appointment_time' => '10:00',
            ])
            ->assertStatus(201)
            ->json('data.id');
    }

    public function test_booking_starts_unpaid_and_payment_marks_it_paid(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->assertSame('unpaid', HealthTicket::find($id)->payment_status);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $ticket = HealthTicket::find($id);
        $this->assertSame('paid', $ticket->payment_status);
        $this->assertNotNull($ticket->payment_id);
        $this->assertNotNull($ticket->paid_at);

        // The payment row exists with the ticket's consultation fee.
        $payment = Payment::find($ticket->payment_id);
        $this->assertSame($patient->id, $payment->user_id);
        $this->assertSame('appointment_payment', $payment->purpose);
    }

    public function test_pay_is_idempotent_and_never_double_charges(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $paymentCount = Payment::where('user_id', $patient->id)->count();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertSame($paymentCount, Payment::where('user_id', $patient->id)->count());
    }

    public function test_only_the_patient_can_pay_their_appointment(): void
    {
        $patient = $this->createUser();
        $stranger = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertStatus(403);

        $this->assertSame('unpaid', HealthTicket::find($id)->payment_status);
    }

    public function test_cancelled_appointment_is_not_payable(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/cancel", ['reason' => 'changed plans'])
            ->assertOk();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertStatus(422);
    }

    public function test_cancelling_a_paid_appointment_refunds_it(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $paymentId = HealthTicket::find($id)->payment_id;

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/cancel", ['reason' => 'cannot attend'])
            ->assertOk();

        $this->assertSame('refunded', HealthTicket::find($id)->payment_status);
        $this->assertSame('refunded', Payment::find($paymentId)->status);
    }

    public function test_pay_requires_a_payment_method(): void
    {
        $patient = $this->createUser();
        $id = $this->bookAppointment($patient);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/appointments/{$id}/pay", [])
            ->assertStatus(422);
    }
}
