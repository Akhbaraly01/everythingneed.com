<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthServiceRequest;
use Tests\TestCase;

/**
 * H-D: Health Bookings - professions + home-visit pricing, "Others"
 * service requests, Documentation-hub content management, and the
 * pharmacy gate alignment (medicines write + prescriptions read).
 */
class HealthcareBookingsTest extends TestCase
{
    use RefreshDatabase;

    private function makeDoctor(array $attributes = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Dr. H-D Pro',
            'specialization' => 'General Practice',
            'profession' => 'doctor',
            'qualification' => 'MBBS',
            'experience_years' => 5,
            'consultation_fee' => 100,
            'is_available' => true,
        ], $attributes));
    }

    public function test_admin_can_create_professional_with_profession_and_home_visit_fee(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/doctors', [
            'full_name' => 'Nurse H-D',
            'specialization' => 'General Nursing',
            'profession' => 'nurse',
            'qualification' => 'RN',
            'experience_years' => 6,
            'consultation_fee' => 80,
            'virtual_fee' => 60,
            'home_visit_fee' => 120,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('doctors', [
            'full_name' => 'Nurse H-D',
            'profession' => 'nurse',
        ]);
        $this->assertSame('120.00', (string) Doctor::where('full_name', 'Nurse H-D')->value('home_visit_fee'));
    }

    public function test_create_doctor_rejects_unknown_profession(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/doctors', [
            'full_name' => 'Dr. Bogus',
            'specialization' => 'General Practice',
            'profession' => 'astronaut',
            'qualification' => 'MBBS',
            'experience_years' => 1,
            'consultation_fee' => 50,
        ])->assertStatus(422);
    }

    public function test_home_visit_booking_uses_home_visit_fee(): void
    {
        $doctor = $this->makeDoctor(['home_visit_fee' => 150]);
        $patient = $this->actingAsUser();
        $this->actingAs($patient, 'sanctum');

        $ticketId = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Post-surgery check at home',
            'consultation_type' => 'home_visit',
            'home_address' => '12 Palm Street, Accra',
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '10:00',
        ])->assertStatus(201)->json('data.id');

        $this->assertDatabaseHas('health_tickets', [
            'id' => $ticketId,
            'consultation_type' => 'home_visit',
            'home_address' => '12 Palm Street, Accra',
        ]);
        $this->assertSame(
            '150.00',
            (string) \Illuminate\Support\Facades\DB::table('health_tickets')->where('id', $ticketId)->value('consultation_fee')
        );
    }

    public function test_home_visit_booking_falls_back_to_consultation_fee(): void
    {
        $doctor = $this->makeDoctor(['consultation_fee' => 90, 'home_visit_fee' => null]);
        $patient = $this->actingAsUser();
        $this->actingAs($patient, 'sanctum');

        $ticketId = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'Home check',
            'consultation_type' => 'home_visit',
            'home_address' => '5 Lake Road',
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '11:00',
        ])->assertStatus(201)->json('data.id');

        $this->assertSame(
            '90.00',
            (string) \Illuminate\Support\Facades\DB::table('health_tickets')->where('id', $ticketId)->value('consultation_fee')
        );
    }

    public function test_doctor_list_filters_by_profession_and_virtual(): void
    {
        $this->makeDoctor(['full_name' => 'Dr. Virtual', 'profession' => 'doctor', 'virtual_fee' => 70]);
        $this->makeDoctor(['full_name' => 'Nurse InPerson', 'profession' => 'nurse', 'virtual_fee' => null]);

        $virtual = $this->getJson('/api/doctors?virtual=true')->assertOk()->json('data');
        $names = collect($virtual)->pluck('full_name')->all();
        $this->assertContains('Dr. Virtual', $names);
        $this->assertNotContains('Nurse InPerson', $names);

        $nurses = $this->getJson('/api/doctors?profession=nurse')->assertOk()->json('data');
        $this->assertContains('Nurse InPerson', collect($nurses)->pluck('full_name')->all());
        $this->assertNotContains('Dr. Virtual', collect($nurses)->pluck('full_name')->all());
    }

    public function test_patient_files_service_request_and_sees_it_in_mine(): void
    {
        $patient = $this->actingAsUser();
        $this->actingAs($patient, 'sanctum');

        $id = $this->postJson('/api/health/service-requests', [
            'category' => 'home-care',
            'title' => 'Nurse for post-surgery care',
            'details' => 'Need a nurse at home for three days after surgery.',
            'location' => 'Accra',
        ])->assertStatus(201)->json('data.id');

        $this->assertDatabaseHas('health_service_requests', [
            'id' => $id,
            'status' => 'open',
        ]);

        $mine = $this->getJson('/api/health/service-requests/mine')->assertOk()->json('data');
        $this->assertContains($id, collect($mine)->pluck('id')->all());

        // Another patient sees nothing.
        $other = $this->actingAsUser();
        $this->actingAs($other, 'sanctum');
        $this->assertNotContains(
            $id,
            collect($this->getJson('/api/health/service-requests/mine')->assertOk()->json('data'))->pluck('id')->all()
        );
    }

    public function test_admin_advances_service_request_forward_only(): void
    {
        $patient = $this->createUser();
        $request = HealthServiceRequest::create([
            'patient_id' => $patient->id,
            'request_number' => 'HSR-TEST0001',
            'category' => 'home-care',
            'title' => 'Home care need',
            'details' => 'Details here.',
            'status' => 'open',
        ]);

        $admin = $this->actingAsUser('healthcare_admin');
        $this->actingAs($admin, 'sanctum');

        // Open -> contacted with a note.
        $this->putJson("/api/admin/healthcare/service-requests/{$request->id}", [
            'action' => 'contact',
            'admin_note' => 'Called the patient, confirming Friday.',
        ])->assertOk()->assertJsonPath('data.status', 'contacted');

        // Contacted -> closed is a backward/sideways jump: rejected.
        $this->putJson("/api/admin/healthcare/service-requests/{$request->id}", [
            'action' => 'close',
        ])->assertStatus(422);

        // Contacted -> scheduled -> closed works.
        $this->putJson("/api/admin/healthcare/service-requests/{$request->id}", [
            'action' => 'schedule',
        ])->assertOk()->assertJsonPath('data.status', 'scheduled');
        $this->putJson("/api/admin/healthcare/service-requests/{$request->id}", [
            'action' => 'close',
        ])->assertOk()->assertJsonPath('data.status', 'closed');

        // Terminal rows are immutable.
        $this->putJson("/api/admin/healthcare/service-requests/{$request->id}", [
            'action' => 'cancel',
        ])->assertStatus(422);
    }

    public function test_healthcare_admin_can_publish_and_hide_health_content(): void
    {
        $admin = $this->actingAsUser('healthcare_admin');
        $this->actingAs($admin, 'sanctum');

        $id = $this->postJson('/api/admin/healthcare/content', [
            'type' => 'prevention_guide',
            'title' => 'H-D Malaria Prevention',
            'summary' => 'Sleep under treated nets.',
        ])->assertStatus(201)->json('data.id');

        // Public library shows it while active.
        $this->assertContains(
            'H-D Malaria Prevention',
            collect($this->getJson('/api/healthcare/prevention-guides')->assertOk()->json('data'))->pluck('title')->all()
        );

        // Hiding removes it from the public library but keeps the admin row.
        $this->putJson("/api/admin/healthcare/content/{$id}", ['is_active' => false])->assertOk();
        $this->assertNotContains(
            'H-D Malaria Prevention',
            collect($this->getJson('/api/healthcare/prevention-guides')->assertOk()->json('data'))->pluck('title')->all()
        );
        $this->assertContains(
            $id,
            collect($this->getJson('/api/admin/healthcare/content')->assertOk()->json('data'))->pluck('id')->all()
        );
    }

    public function test_content_store_rejects_unknown_type(): void
    {
        $admin = $this->actingAsUser('healthcare_admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/admin/healthcare/content', [
            'type' => 'podcast',
            'title' => 'Bogus',
        ])->assertStatus(422);
    }

    public function test_pharmacy_admin_can_add_medicine_but_plain_user_cannot(): void
    {
        $admin = $this->actingAsUser('pharmacy_admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/medicines', [
            'name' => 'H-D Paracetamol 500mg',
            'price' => 5.5,
            'stock' => 100,
            'category' => 'analgesics',
        ])->assertStatus(201);
        $this->assertDatabaseHas('medicines', ['name' => 'H-D Paracetamol 500mg']);

        $user = $this->actingAsUser();
        $this->actingAs($user, 'sanctum');
        $this->postJson('/api/medicines', [
            'name' => 'H-D Aspirin',
            'price' => 3,
            'category' => 'analgesics',
        ])->assertStatus(403);
    }

    public function test_healthcare_admin_can_read_prescriptions_oversight(): void
    {
        $admin = $this->actingAsUser('healthcare_admin');
        $this->actingAs($admin, 'sanctum');

        $this->getJson('/api/admin/pharmacy/prescriptions')->assertOk();

        $user = $this->actingAsUser();
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/admin/pharmacy/prescriptions')->assertForbidden();
    }
}
