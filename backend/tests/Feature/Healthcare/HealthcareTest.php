<?php

namespace Tests\Feature\Healthcare;

use Tests\TestCase;
use App\Models\User;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;

class HealthcareTest extends TestCase
{
    private function createDoctor(array $attributes = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => fake()->name(),
            'specialization' => 'Cardiology',
            'profession' => 'doctor',
            'qualification' => 'MBBS, MD',
            'experience_years' => 10,
            'consultation_fee' => 50.00,
            'virtual_fee' => 40.00,
            'is_available' => true,
        ], $attributes));
    }

    private function createHealthTicket(User $patient, array $attributes = []): HealthTicket
    {
        return HealthTicket::create(array_merge([
            'patient_id' => $patient->id,
            'ticket_number' => 'HT-' . strtoupper(uniqid()),
            'symptoms' => 'Headache and fever',
            'consultation_type' => 'in_person',
            'status' => 'pending',
        ], $attributes));
    }

    public function test_unauthenticated_user_can_list_doctors(): void
    {
        $this->createDoctor(['full_name' => 'Dr. Smith']);

        $response = $this->getJson('/api/doctors');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'full_name', 'specialization']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_user_can_list_doctors(): void
    {
        $user = $this->createUser();
        $this->createDoctor(['full_name' => 'Dr. Alice']);
        $this->createDoctor(['full_name' => 'Dr. Bob']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/doctors');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'full_name', 'specialization']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_can_view_a_doctor(): void
    {
        $user = $this->createUser();
        $doctor = $this->createDoctor(['full_name' => 'Dr. Target']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/doctors/{$doctor->id}");

        $response->assertOk()
            ->assertJsonFragment(['full_name' => 'Dr. Target']);
    }

    public function test_view_nonexistent_doctor_returns_404(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/doctors/nonexistent-id');

        $response->assertStatus(404)
            ->assertJsonFragment(['message' => 'Doctor not found']);
    }

    public function test_admin_can_create_doctor(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Dr. New Doctor',
            'specialization' => 'Neurology',
            'profession' => 'doctor',
            'qualification' => 'MBBS, DM Neurology',
            'experience_years' => 15,
            'consultation_fee' => 75.00,
            'virtual_fee' => 60.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Doctor created successfully']);

        $this->assertDatabaseHas('doctors', [
            'full_name' => 'Dr. New Doctor',
            'specialization' => 'Neurology',
        ]);
    }

    public function test_regular_user_cannot_create_doctor(): void
    {
        $user = $this->actingAsUser();

        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Dr. Unauthorized',
            'specialization' => 'Dermatology',
            'qualification' => 'MBBS, MD Dermatology',
            'experience_years' => 5,
            'consultation_fee' => 40.00,
        ]);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_create_doctor(): void
    {
        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Dr. No Auth',
            'specialization' => 'Pediatrics',
            'qualification' => 'MBBS, MD Pediatrics',
            'experience_years' => 8,
            'consultation_fee' => 45.00,
        ]);

        $response->assertStatus(401);
    }

    public function test_create_doctor_requires_full_name(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/doctors', [
            'specialization' => 'Oncology',
            'qualification' => 'MBBS, DM Oncology',
            'experience_years' => 20,
            'consultation_fee' => 100.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['full_name']);
    }

    public function test_create_doctor_requires_specialization(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Dr. Missing Spec',
            'qualification' => 'MBBS',
            'experience_years' => 3,
            'consultation_fee' => 30.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['specialization']);
    }

    public function test_create_doctor_requires_consultation_fee(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Dr. No Fee',
            'specialization' => 'Surgery',
            'qualification' => 'MBBS, MS',
            'experience_years' => 12,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['consultation_fee']);
    }

    public function test_user_can_book_appointment(): void
    {
        $user = $this->actingAsUser();
        $doctor = $this->createDoctor();

        $response = $this->postJson('/api/appointments', [
            'symptoms' => 'Persistent cough and mild fever',
            'description' => 'Symptoms started 3 days ago',
            'consultation_type' => 'in_person',
            'appointment_date' => now()->addDays(3)->format('Y-m-d'),
            'appointment_time' => '10:00',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Appointment booked successfully']);

        $this->assertDatabaseHas('health_tickets', [
            'patient_id' => $user->id,
            'symptoms' => 'Persistent cough and mild fever',
            'status' => 'pending',
        ]);
    }

    public function test_booking_appointment_requires_symptoms(): void
    {
        $user = $this->actingAsUser();

        $response = $this->postJson('/api/appointments', [
            'description' => 'Just feeling unwell',
            'consultation_type' => 'virtual',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['symptoms']);
    }

    public function test_unauthenticated_user_cannot_book_appointment(): void
    {
        $response = $this->postJson('/api/appointments', [
            'symptoms' => 'Back pain',
            'consultation_type' => 'in_person',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_list_own_appointments(): void
    {
        $user = $this->createUser();
        $this->createHealthTicket($user, ['symptoms' => 'Fever']);
        $this->createHealthTicket($user, ['symptoms' => 'Cold']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/appointments');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'symptoms', 'status']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_only_sees_own_appointments(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        $this->createHealthTicket($user1, ['symptoms' => 'User1 symptom']);
        $this->createHealthTicket($user2, ['symptoms' => 'User2 symptom']);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/appointments');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('User1 symptom', $response->json('data.0.symptoms'));
    }

    public function test_user_can_view_own_appointment(): void
    {
        $user = $this->createUser();
        $ticket = $this->createHealthTicket($user, ['symptoms' => 'Joint pain']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/appointments/{$ticket->id}");

        $response->assertOk()
            ->assertJsonFragment(['symptoms' => 'Joint pain']);
    }

    public function test_user_can_cancel_own_appointment(): void
    {
        $user = $this->createUser();
        $ticket = $this->createHealthTicket($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/appointments/{$ticket->id}/cancel");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Appointment cancelled successfully']);

        $ticket->refresh();
        $this->assertEquals('cancelled', $ticket->status);
    }

    public function test_doctor_listing_supports_specialization_filter(): void
    {
        $user = $this->createUser();
        $this->createDoctor(['specialization' => 'Cardiology', 'full_name' => 'Dr. Heart']);
        $this->createDoctor(['specialization' => 'Neurology', 'full_name' => 'Dr. Brain']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/doctors?specialization=Cardiology');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Dr. Heart', $response->json('data.0.full_name'));
    }
}
