<?php

namespace Tests\Feature\Healthcare;

use Tests\TestCase;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\Doctor;

class ConsultationWorkflowTest extends TestCase
{
    private function bookTicket(object $patient): string
    {
        $doctor = Doctor::create([
            'full_name' => 'Dr. Test',
            'specialization' => 'General Practice',
            'qualification' => 'MD',
            'experience_years' => 5,
            'consultation_fee' => 100,
        ]);

        $ticket = HealthTicket::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'ticket_number' => 'HT-TEST-'.uniqid(),
            'symptoms' => 'Fever',
            'description' => 'High fever for two days',
            'consultation_type' => 'in_person',
            'status' => 'in_consultation',
        ]);

        return $ticket->id;
    }

    public function test_doctor_completes_consultation_with_prescription(): void
    {
        $patient = $this->actingAsUser();

        $ticketId = $this->bookTicket($patient);

        // Admin (acting as registrar) completes with clinical data
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        $response = $this->postJson("/api/appointments/{$ticketId}/complete", [
            'diagnosis' => 'Acute viral infection',
            'notes' => 'Rest and hydration advised.',
            'follow_up_date' => now()->addDays(7)->toDateString(),
            'prescription_items' => [
                ['name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => '3x daily', 'duration' => '5 days'],
            ],
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Consultation completed successfully']);

        $this->assertEquals('completed', HealthTicket::find($ticketId)->status);

        // Patient retrieves the clinical record
        $record = $this->getJson("/api/appointments/{$ticketId}/consultation");
        $record->assertOk();
        $this->assertEquals('Acute viral infection', $record->json('data.diagnosis'));

        // Prescription was issued to the patient
        $prescription = \Modules\Pharmacy\Entities\Prescription::where('patient_id', $patient->id)->first();
        $this->assertNotNull($prescription);
        $this->assertEquals('active', $prescription->status);
        $this->assertCount(1, $prescription->items);
    }

    public function test_stranger_cannot_read_consultation_record(): void
    {
        $patient = $this->createUser();
        $ticketId = $this->bookTicket($patient);
        $this->actingAsUser();

        $this->getJson("/api/appointments/{$ticketId}/consultation")
            ->assertStatus(403);
    }

    public function test_doctor_availability_round_trip(): void
    {
        $doctor = Doctor::create([
            'full_name' => 'Dr. Slots',
            'specialization' => 'Cardiology',
            'qualification' => 'MD',
            'experience_years' => 8,
            'consultation_fee' => 120,
        ]);

        // Public read returns empty initially
        $this->getJson("/api/doctors/{$doctor->id}/availability")
            ->assertOk()
            ->assertJson(['data' => []]);

        // Admin sets slots
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/doctors/{$doctor->id}/availability", [
                'slots' => [
                    ['day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '12:00'],
                    ['day_of_week' => 3, 'start_time' => '14:00', 'end_time' => '17:00'],
                ],
            ])
            ->assertStatus(201)
            ->assertJsonCount(2, 'data');

        // Public read now sees them
        $this->getJson("/api/doctors/{$doctor->id}/availability")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}