<?php

namespace Tests\Feature\WaveK;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Pharmacy\Entities\Medicine;
use Tests\TestCase;

class WaveKHealthcareTest extends TestCase
{
    use RefreshDatabase;

    private function makeDoctor(array $overrides = []): Doctor
    {
        return Doctor::create(array_merge([
            'full_name' => 'Dr. Wave K',
            'specialization' => 'Cardiology',
            'qualification' => 'MBBS',
            'experience_years' => 8,
            'consultation_fee' => 50,
            'is_available' => true,
        ], $overrides));
    }

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => 'Paracetamol 500mg',
            'category' => 'pain-relief',
            'price' => 5,
            'stock_quantity' => 100,
        ], $overrides));
    }

    public function test_database_rejects_double_booked_slots_even_if_the_check_races(): void
    {
        $patient = $this->createUser();
        $doctor = $this->makeDoctor();

        HealthTicket::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'ticket_number' => 'HT-K-1',
            'symptoms' => 'cough',
            'status' => 'assigned',
            'appointment_date' => '2030-05-01',
            'appointment_time' => '09:00',
        ]);

        // A raced insert (check passed elsewhere) still fails at the database.
        // The savepoint keeps the test transaction usable afterwards.
        try {
            DB::transaction(fn () => HealthTicket::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'ticket_number' => 'HT-K-2',
                'symptoms' => 'cough',
                'status' => 'assigned',
                'appointment_date' => '2030-05-01',
                'appointment_time' => '09:00',
            ]));
            $this->fail('Expected a unique violation for the double-booked slot');
        } catch (\Illuminate\Database\QueryException $e) {
            $this->assertSame('23505', (string) ($e->errorInfo[0] ?? ''));
        }

        // Cancelled tickets never conflict.
        HealthTicket::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'ticket_number' => 'HT-K-3',
            'symptoms' => 'cough',
            'status' => 'cancelled',
            'appointment_date' => '2030-05-01',
            'appointment_time' => '09:00',
        ]);
        $this->assertSame(1, HealthTicket::where('status', 'cancelled')->count());
    }

    public function test_booking_api_reports_the_same_clash_message_under_lock(): void
    {
        $patient = $this->createUser();
        $doctor = $this->makeDoctor();

        $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'fever',
            'appointment_date' => '2030-06-01',
            'appointment_time' => '10:00',
        ])->assertStatus(201);

        $this->actingAs($patient, 'sanctum')->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'symptoms' => 'fever again',
            'appointment_date' => '2030-06-01',
            'appointment_time' => '10:00',
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'Doctor is already booked for that slot']);
    }

    public function test_medicine_vendor_details_persist_and_show_renders(): void
    {
        $admin = $this->createAdmin();
        $vendor = \Modules\Vendors\Entities\Vendor::create([
            'user_id' => $this->createUser()->id,
            'store_name' => 'Wave K Pharmacy',
            'category' => 'pharmacy',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/medicines', [
            'name' => 'Amoxicillin 250mg',
            'price' => 12.5,
            'stock' => 40,
            'category' => 'antibiotics',
            'dosage_form' => 'capsule',
            'strength' => '250mg',
            'manufacturer' => 'Wave Labs',
            'vendor_id' => $vendor->id,
        ])->assertStatus(201);

        $medicine = Medicine::findOrFail($response->json('data.id'));
        $this->assertSame(40, (int) $medicine->stock_quantity);
        $this->assertSame('capsule', $medicine->dosage_form);
        $this->assertSame($vendor->id, $medicine->vendor_id);

        // The vendor relation loads instead of throwing.
        $this->actingAs($admin, 'sanctum')->getJson("/api/medicines/{$medicine->id}")
            ->assertOk()
            ->assertJsonPath('data.vendor.id', $vendor->id);
    }

    public function test_pharmacy_orders_enforce_stock_and_prescriptions(): void
    {
        $user = $this->createUser();
        $plain = $this->makeMedicine(['stock_quantity' => 2]);
        $rx = $this->makeMedicine(['name' => 'Rx Drug', 'requires_prescription' => true, 'stock_quantity' => 50]);

        // Over stock: 422, nothing written.
        $this->actingAs($user, 'sanctum')->postJson('/api/pharmacy/orders', [
            'items' => [['medicine_id' => $plain->id, 'quantity' => 5]],
        ])->assertStatus(422);
        $this->assertSame(0, \Modules\Orders\Entities\MedicineOrder::count());

        // Prescription-only without an active prescription: 422.
        $this->actingAs($user, 'sanctum')->postJson('/api/pharmacy/orders', [
            'items' => [['medicine_id' => $rx->id, 'quantity' => 1]],
        ])->assertStatus(422)
            ->assertJsonFragment(['message' => 'An active prescription is required for one or more items']);

        // With an active prescription: 201 and stock decremented.
        DB::table('prescriptions')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'code' => 'RX-WAVEK-1',
            'patient_id' => $user->id,
            'status' => 'active',
            'items' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->actingAs($user, 'sanctum')->postJson('/api/pharmacy/orders', [
            'items' => [
                ['medicine_id' => $rx->id, 'quantity' => 2],
                ['medicine_id' => $plain->id, 'quantity' => 2],
            ],
        ])->assertStatus(201);

        $this->assertSame(48, (int) $rx->fresh()->stock_quantity);
        $this->assertSame(0, (int) $plain->fresh()->stock_quantity);
    }

    public function test_doctor_search_filters_by_name_and_specialty(): void
    {
        $this->makeDoctor(['full_name' => 'Dr. Heart Surgeon', 'specialization' => 'Cardiology']);
        $this->makeDoctor(['full_name' => 'Dr. Skin Care', 'specialization' => 'Dermatology']);

        $response = $this->getJson('/api/doctors?q=cardio')->assertOk();
        $this->assertSame(1, $response->json('meta.total'));

        $response = $this->getJson('/api/doctors?q=skin')->assertOk();
        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame('Dr. Skin Care', $response->json('data.0.full_name'));
    }

    public function test_emergency_endpoint_reports_configured_numbers(): void
    {
        $this->getJson('/api/health/emergency?country=NG')
            ->assertOk()
            ->assertJsonPath('data.country', 'NG')
            ->assertJsonStructure(['data' => ['numbers', 'support']]);

        $numbers = $this->getJson('/api/health/emergency?country=NG')->json('data.numbers');
        $this->assertNotEmpty($numbers);
    }

    public function test_healthcare_spec_pages_render(): void
    {
        $user = $this->createUser();
        $doctor = $this->makeDoctor();

        // Public spec pages render for guests.
        foreach ([
            '/healthcare/doctors',
            "/healthcare/doctors/{$doctor->id}",
            "/healthcare/doctors/{$doctor->id}/availability",
            "/healthcare/doctors/{$doctor->id}/reviews",
            '/healthcare/labs/anything',
            '/healthcare/health-services',
            '/healthcare/providers',
            "/healthcare/providers/{$doctor->id}",
            '/healthcare/search',
            '/healthcare/pharmacy',
            '/healthcare/pharmacy/products',
            '/pharmacy/products/anything',
        ] as $path) {
            $this->get($path)->assertOk();
        }

        // Booking flows require auth.
        $this->get("/healthcare/doctors/{$doctor->id}/book")->assertRedirect(route('login'));
        $this->get('/healthcare/labs/bookings')->assertRedirect(route('login'));

        $this->actingAs($user, 'web')->get("/healthcare/doctors/{$doctor->id}/book")->assertOk();
        $this->actingAs($user, 'web')->get('/healthcare/labs/bookings')->assertOk();
    }
}
