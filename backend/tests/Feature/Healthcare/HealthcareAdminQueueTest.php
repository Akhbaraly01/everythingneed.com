<?php

namespace Tests\Feature\Healthcare;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;
use Tests\TestCase;

/**
 * W13: healthcare admin ticket queue parity.
 *
 * Pins GET /api/admin/healthcare/tickets: role gate, status filter,
 * ticket-number search, and pagination shape.
 */
class HealthcareAdminQueueTest extends TestCase
{
    use RefreshDatabase;

    private function makeTicket(string $number, string $status, \App\Models\User $patient): HealthTicket
    {
        $doctor = Doctor::create([
            'full_name' => 'Dr. Queue',
            'specialization' => 'General',
            'qualification' => 'MD',
            'experience_years' => 5,
            'consultation_fee' => 100,
            'is_available' => true,
        ]);

        return HealthTicket::create([
            'ticket_number' => $number,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'symptoms' => 'Fixture symptoms',
            'consultation_type' => 'virtual',
            'consultation_fee' => 100,
            'appointment_date' => now()->addDays(2)->toDateString(),
            'status' => $status,
        ]);
    }

    public function test_admin_queue_filters_by_status_and_searches_by_ticket_number(): void
    {
        $patient = $this->createUser();
        $this->makeTicket('HT-Q-ASSIGNED', HealthTicket::STATUS_ASSIGNED, $patient);
        $this->makeTicket('HT-Q-CANCELLED', HealthTicket::STATUS_CANCELLED, $patient);

        $admin = $this->createAdmin();

        $assigned = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/healthcare/tickets?status=assigned')
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $assigned);
        $this->assertSame('HT-Q-ASSIGNED', $assigned[0]['ticket_number']);

        $search = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/healthcare/tickets?search=HT-Q-CANCELLED')
            ->assertOk()
            ->json('data');
        $this->assertCount(1, $search);
        $this->assertSame('cancelled', $search[0]['status']);

        $queue = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/healthcare/tickets')
            ->assertOk();
        $this->assertGreaterThanOrEqual(2, $queue->json('total'));
        $this->assertArrayHasKey('meta', $queue->json());
    }

    public function test_admin_queue_is_role_gated(): void
    {
        // Unauthenticated first (actingAs persists for the rest of the test).
        $this->getJson('/api/admin/healthcare/tickets')
            ->assertStatus(401);

        $patient = $this->createUser();

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/healthcare/tickets')
            ->assertStatus(403);
    }
}
