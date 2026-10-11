<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\Doctor;
use Tests\TestCase;

/**
 * Spec 102 (admin-created doctor example): a doctor created + published
 * through the admin console must automatically appear in healthcare
 * listings, specialty filters, search, the doctor detail and booking -
 * with no manual re-publish step.
 */
class AdminCreatedDoctorDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_created_doctor_appears_in_every_healthcare_surface(): void
    {
        // 1. Admin creates the doctor (spec 102).
        $this->actingAsAdmin();
        $this->postJson('/api/doctors', [
            'full_name' => 'Dr. Quantum Unique',
            'specialization' => 'QuantumNeurologyUnique',
            'profession' => 'doctor',
            'qualification' => 'MBBS, PhD',
            'experience_years' => 12,
            'consultation_fee' => 90.00,
            'virtual_fee' => 70.00,
        ])->assertStatus(201);

        $doctorId = Doctor::where('full_name', 'Dr. Quantum Unique')->value('id');
        $this->assertNotNull($doctorId);

        // 2. Healthcare listing (unfiltered).
        $list = $this->getJson('/api/doctors?per_page=100')->assertOk();
        $ids = collect($list->json('data'))->pluck('id')->all();
        $this->assertContains($doctorId, $ids, 'healthcare listing');

        // 3. Specialty page filter.
        $specialty = $this->getJson('/api/doctors?specialization=QuantumNeurologyUnique')
            ->assertOk();
        $this->assertContains(
            $doctorId,
            collect($specialty->json('data'))->pluck('id')->all(),
            'specialty filter'
        );

        // 4. Search.
        $search = $this->getJson('/api/search?q=QuantumNeurologyUnique&type=doctors')
            ->assertOk();
        $this->assertContains(
            $doctorId,
            collect($search->json('data.doctors'))->pluck('id')->all(),
            'search'
        );

        // 5. Doctor detail.
        $this->getJson('/api/doctors/'.$doctorId)
            ->assertOk()
            ->assertJsonPath('data.id', $doctorId);

        // 6. Booking against this doctor (fresh patient).
        $patient = $this->createUser();
        $this->actingAs($patient, 'sanctum');
        $this->postJson('/api/appointments', [
            'doctor_id' => $doctorId,
            'symptoms' => 'Spec 102 booking probe',
            'description' => 'Discovery chain booking',
            'consultation_type' => 'virtual',
            'appointment_date' => now()->addDays(3)->format('Y-m-d'),
            'appointment_time' => '10:00',
        ])->assertStatus(201);
    }
}
