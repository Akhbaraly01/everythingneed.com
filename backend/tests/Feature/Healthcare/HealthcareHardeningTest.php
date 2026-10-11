<?php

namespace Tests\Feature\Healthcare;

use App\Models\User;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;
use Tests\TestCase;

class HealthcareHardeningTest extends TestCase
{
    private function createDoctor(array $attrs = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Dr. Hardening',
            'specialization' => 'General Practice',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 80,
            'is_available' => true,
        ], $attrs));
    }

    private function createTicket(User $patient, array $attrs = []): HealthTicket
    {
        return HealthTicket::create(array_merge([
            'patient_id' => $patient->id,
            'ticket_number' => 'HT-'.strtoupper(uniqid()),
            'symptoms' => 'Cough',
            'consultation_type' => 'in_person',
            'status' => 'pending',
        ], $attrs));
    }

    public function test_booking_with_unavailable_doctor_rejected(): void
    {
        $user = $this->actingAsUser();
        $doctor = $this->createDoctor(['is_available' => false]);

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Fever',
            'consultation_type' => 'in_person',
            'appointment_date' => now()->addDays(2)->format('Y-m-d'),
            'appointment_time' => '10:00',
        ])->assertStatus(422);
    }

    public function test_double_booking_same_slot_rejected(): void
    {
        $user = $this->actingAsUser();
        $doctor = $this->createDoctor();
        $date = now()->addDays(3)->format('Y-m-d');
        $time = '11:00';

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Headache',
            'appointment_date' => $date,
            'appointment_time' => $time,
        ])->assertStatus(201);

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Migraine',
            'appointment_date' => $date,
            'appointment_time' => $time,
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'Doctor is already booked for that slot']);
    }

    public function test_cancelled_slot_can_be_rebooked(): void
    {
        $user = $this->actingAsUser();
        $doctor = $this->createDoctor();
        $date = now()->addDays(4)->format('Y-m-d');
        $time = '09:30';

        $first = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'First',
            'appointment_date' => $date,
            'appointment_time' => $time,
        ])->assertStatus(201);

        $this->postJson('/api/appointments/'.$first->json('data.id').'/cancel', [
            'reason' => 'changed plans',
        ])->assertOk();

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Second',
            'appointment_date' => $date,
            'appointment_time' => $time,
        ])->assertStatus(201);
    }

    public function test_assign_doctor_requires_available_doctor(): void
    {
        $admin = $this->actingAsAdmin();
        $patient = $this->createUser();
        $ticket = $this->createTicket($patient);
        $doctor = $this->createDoctor(['is_available' => false]);

        $this->postJson("/api/appointments/{$ticket->id}/assign-doctor", [
            'doctor_id' => $doctor->id,
        ])->assertStatus(422);
    }

    public function test_start_consultation_moves_assigned_to_in_consultation(): void
    {
        $admin = $this->actingAsAdmin();
        $patient = $this->createUser();
        $doctor = $this->createDoctor();
        $ticket = $this->createTicket($patient, ['doctor_id' => $doctor->id, 'status' => 'assigned']);

        $this->postJson("/api/appointments/{$ticket->id}/start")->assertOk();

        $this->assertEquals('in_consultation', $ticket->fresh()->status);
    }

    public function test_start_rejects_pending_ticket(): void
    {
        $this->actingAsAdmin();
        $patient = $this->createUser();
        $ticket = $this->createTicket($patient, ['status' => 'pending']);

        $this->postJson("/api/appointments/{$ticket->id}/start")->assertStatus(422);
    }

    public function test_patient_cannot_complete_consultation(): void
    {
        $patient = $this->actingAsUser();
        $doctor = $this->createDoctor();
        $ticket = $this->createTicket($patient, [
            'doctor_id' => $doctor->id,
            'status' => 'in_consultation',
        ]);

        $this->postJson("/api/appointments/{$ticket->id}/complete", [
            'diagnosis' => 'self-diagnosed',
        ])->assertStatus(403);
    }

    public function test_cancel_stores_reason(): void
    {
        $patient = $this->actingAsUser();
        $ticket = $this->createTicket($patient);

        $this->postJson("/api/appointments/{$ticket->id}/cancel", [
            'reason' => 'no longer needed',
        ])->assertOk();

        $ticket->refresh();
        $this->assertEquals('cancelled', $ticket->status);
        $this->assertStringContainsString('no longer needed', (string) $ticket->description);
    }

    public function test_book_appointment_fires_event(): void
    {
        $user = $this->actingAsUser();
        $doctor = $this->createDoctor();

        $fired = false;
        \Illuminate\Support\Facades\Event::listen(
            \Modules\Healthcare\Events\AppointmentBooked::class,
            function () use (&$fired) {
                $fired = true;
            }
        );

        $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Event check',
            'appointment_date' => now()->addDays(5)->format('Y-m-d'),
            'appointment_time' => '14:00',
        ])->assertStatus(201);

        $this->assertTrue($fired, 'AppointmentBooked event was not fired');
    }

    public function test_assign_fires_doctor_assigned_event(): void
    {
        $this->actingAsAdmin();
        $patient = $this->createUser();
        $ticket = $this->createTicket($patient);
        $doctor = $this->createDoctor();

        $fired = false;
        \Illuminate\Support\Facades\Event::listen(
            \Modules\Healthcare\Events\DoctorAssigned::class,
            function () use (&$fired) {
                $fired = true;
            }
        );

        $this->postJson("/api/appointments/{$ticket->id}/assign-doctor", [
            'doctor_id' => $doctor->id,
        ])->assertOk();

        $this->assertTrue($fired, 'DoctorAssigned event was not fired');
    }
}
