<?php

namespace Tests\Feature\Healthcare;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthContent;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\LabBooking;
use Modules\Healthcare\Entities\LabTest;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console healthcare CRUD: provider full edit + guarded delete,
 * lab test delete, library content delete (all soft, all role gated
 * to super_admin / administrator / healthcare_admin).
 */
class AdminHealthcareCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function makeDoctor(array $overrides = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Ama Serwaa',
            'specialization' => 'General Practice',
            'profession' => 'doctor',
            'qualification' => 'MBChB',
            'experience_years' => 5,
            'consultation_fee' => 50,
        ], $overrides));
    }

    private function makeLabTest(array $overrides = []): LabTest
    {
        return LabTest::create(array_merge([
            'name' => 'Full Blood Count',
            'slug' => 'fbc-' . Str::lower(Str::random(6)),
            'category' => 'hematology',
            'price' => 30,
            'result_time_hours' => 24,
            'is_active' => true,
        ], $overrides));
    }

    #[Test]
    public function test_super_admin_edits_every_doctor_field(): void
    {
        $this->actingAsAdmin();
        $doctor = $this->makeDoctor();

        $this->putJson("/api/admin/healthcare/doctors/{$doctor->id}", [
            'full_name' => 'Kwame Mensah',
            'specialization' => 'Cardiology',
            'profession' => 'nurse',
            'qualification' => 'BSc Nursing',
            'experience_years' => 9,
            'consultation_fee' => 80,
            'virtual_fee' => 40,
            'home_visit_fee' => 120,
            'is_available' => false,
        ])->assertOk()
            ->assertJsonPath('data.full_name', 'Kwame Mensah')
            ->assertJsonPath('data.profession', 'nurse')
            ->assertJsonPath('data.is_available', false);

        $fresh = Doctor::findOrFail($doctor->id);
        $this->assertSame('80.00', (string) $fresh->consultation_fee);
        $this->assertSame(9, $fresh->experience_years);
    }

    #[Test]
    public function test_doctor_empty_payload_is_rejected(): void
    {
        $this->actingAsAdmin();
        $doctor = $this->makeDoctor();

        $this->putJson("/api/admin/healthcare/doctors/{$doctor->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_doctor_edit_404s_for_unknown_id(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/healthcare/doctors/' . Str::uuid(), ['full_name' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_healthcare_admin_role_can_edit_and_delete_doctor(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'healthcare_admin');
        $this->actingAs($actor, 'sanctum');

        $doctor = $this->makeDoctor();

        $this->putJson("/api/admin/healthcare/doctors/{$doctor->id}", ['full_name' => 'Renamed'])
            ->assertOk();

        $this->deleteJson("/api/admin/healthcare/doctors/{$doctor->id}")->assertOk();
        $this->assertNull(Doctor::find($doctor->id));
    }

    #[Test]
    public function test_plain_user_cannot_edit_or_delete_doctor(): void
    {
        $doctor = $this->makeDoctor();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/admin/healthcare/doctors/{$doctor->id}", ['full_name' => 'Hacked'])->assertStatus(403);
        $this->deleteJson("/api/admin/healthcare/doctors/{$doctor->id}")->assertStatus(403);
    }

    #[Test]
    public function test_doctor_delete_soft_deletes_and_hides_from_public(): void
    {
        $this->actingAsAdmin();
        $doctor = $this->makeDoctor();

        $this->deleteJson("/api/admin/healthcare/doctors/{$doctor->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Doctor deleted');

        $this->assertNull(Doctor::find($doctor->id));
        $this->assertNotNull(Doctor::withTrashed()->find($doctor->id)?->deleted_at);

        $this->getJson("/api/doctors/{$doctor->id}")->assertStatus(404);
    }

    #[Test]
    public function test_doctor_delete_is_refused_while_tickets_exist(): void
    {
        $this->actingAsAdmin();
        $doctor = $this->makeDoctor();

        HealthTicket::create([
            'patient_id' => User::factory()->create()->id,
            'doctor_id' => $doctor->id,
            'ticket_number' => 'HT-GUARD-1',
            'symptoms' => 'Headache',
            'status' => 'pending',
        ]);

        $this->deleteJson("/api/admin/healthcare/doctors/{$doctor->id}")
            ->assertStatus(422);

        $this->assertNotNull(Doctor::find($doctor->id));
    }

    #[Test]
    public function test_lab_test_full_edit_and_empty_guard(): void
    {
        $this->actingAsAdmin();
        $lab = $this->makeLabTest();

        $this->putJson("/api/admin/healthcare/labs/{$lab->id}", [
            'name' => 'Complete Blood Count',
            'price' => 45,
            'result_time_hours' => 12,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Complete Blood Count');

        $this->assertSame('45.00', (string) LabTest::findOrFail($lab->id)->price);

        $this->putJson("/api/admin/healthcare/labs/{$lab->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_lab_test_delete_soft_deletes_and_is_refused_with_bookings(): void
    {
        $this->actingAsAdmin();
        $free = $this->makeLabTest();
        $booked = $this->makeLabTest(['name' => 'Malaria RDT']);

        LabBooking::create([
            'patient_id' => User::factory()->create()->id,
            'lab_test_id' => $booked->id,
            'booking_number' => 'LB-GUARD-1',
            'appointment_date' => now()->addDays(2)->toDateString(),
            'appointment_time' => '09:00',
            'price' => 30,
            'status' => 'pending',
            'is_paid' => false,
        ]);

        $this->deleteJson("/api/admin/healthcare/labs/{$booked->id}")->assertStatus(422);
        $this->assertNotNull(LabTest::find($booked->id));

        $this->deleteJson("/api/admin/healthcare/labs/{$free->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Lab test deleted');
        $this->assertNull(LabTest::find($free->id));
        $this->assertNotNull(LabTest::withTrashed()->find($free->id)?->deleted_at);
    }

    #[Test]
    public function test_content_edit_empty_guard_and_delete(): void
    {
        $this->actingAsAdmin();
        $content = HealthContent::create([
            'type' => 'prevention_guide',
            'title' => 'Malaria Prevention',
            'slug' => 'malaria-prevention-' . Str::lower(Str::random(6)),
            'is_active' => true,
        ]);

        $this->putJson("/api/admin/healthcare/content/{$content->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');

        $this->putJson("/api/admin/healthcare/content/{$content->id}", ['title' => 'Updated Guide'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated Guide');

        $this->deleteJson("/api/admin/healthcare/content/{$content->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Health content deleted');

        $this->assertNull(HealthContent::find($content->id));
        $this->assertNotNull(HealthContent::withTrashed()->find($content->id)?->deleted_at);
    }
}
