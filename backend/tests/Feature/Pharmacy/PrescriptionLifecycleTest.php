<?php

namespace Tests\Feature\Pharmacy;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Pharmacy\Entities\Prescription;
use Tests\TestCase;

/**
 * H-B: prescription -> pharmacy fulfilment chain, expiry enforcement, and
 * admin prescription oversight.
 */
class PrescriptionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => 'Amoxicillin',
            'generic_name' => 'Amoxicillin',
            'category' => 'Antibiotics',
            'price' => 12.99,
            'requires_prescription' => true,
            'stock_quantity' => 50,
        ], $overrides));
    }

    private function makePrescription(User $patient, array $overrides = []): Prescription
    {
        return Prescription::create(array_merge([
            'code' => 'RX-'.strtoupper(\Illuminate\Support\Str::random(8)),
            'patient_id' => $patient->id,
            'items' => [['name' => 'Amoxicillin', 'dosage' => '500mg']],
            'status' => Prescription::STATUS_ACTIVE,
        ], $overrides));
    }

    public function test_patient_can_order_their_active_prescription_to_pharmacy(): void
    {
        $patient = $this->createUser();
        $medicine = $this->makeMedicine();
        $rx = $this->makePrescription($patient);

        $res = $this->actingAs($patient, 'sanctum')
            ->postJson("/api/prescriptions/{$rx->id}/order", [
                'items' => [['name' => 'Amoxicillin', 'quantity' => 2]],
            ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.prescription_id', $rx->id)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('medicine_orders', [
            'prescription_id' => $rx->id,
            'user_id' => $patient->id,
        ]);
        $this->assertSame(48, $medicine->fresh()->stock_quantity);
    }

    public function test_cannot_order_another_patients_prescription(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $this->makeMedicine();
        $rx = $this->makePrescription($owner);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/prescriptions/{$rx->id}/order", [
                'items' => [['name' => 'Amoxicillin']],
            ])->assertStatus(404);
    }

    public function test_expired_prescription_is_blocked_from_ordering(): void
    {
        $patient = $this->createUser();
        $this->makeMedicine();
        $rx = $this->makePrescription($patient, [
            'expires_at' => now()->subDay(),
        ]);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/prescriptions/{$rx->id}/order", [
                'items' => [['name' => 'Amoxicillin']],
            ])->assertStatus(422)
            ->assertJsonPath('message', 'This prescription has expired');
    }

    public function test_filled_prescription_is_blocked_from_ordering(): void
    {
        $patient = $this->createUser();
        $this->makeMedicine();
        $rx = $this->makePrescription($patient, [
            'status' => Prescription::STATUS_FILLED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/prescriptions/{$rx->id}/order", [
                'items' => [['name' => 'Amoxicillin']],
            ])->assertStatus(422)
            ->assertJsonPath('message', 'Only active prescriptions can be ordered');
    }

    public function test_delivering_a_linked_order_marks_the_prescription_filled(): void
    {
        $patient = $this->createUser();
        $admin = $this->createAdmin();
        $this->makeMedicine();
        $rx = $this->makePrescription($patient);

        $order = MedicineOrder::create([
            'user_id' => $patient->id,
            'order_number' => 'MED-FILLTEST',
            'delivery_address' => '1 Test Way',
            'prescription_id' => $rx->id,
            'total_amount' => 12.99,
            'status' => MedicineOrder::STATUS_PENDING,
        ]);

        foreach (['confirm', 'process', 'ship', 'deliver'] as $step) {
            $this->actingAs($admin, 'sanctum')
                ->postJson("/api/admin/pharmacy/orders/{$order->id}/{$step}")
                ->assertOk();
        }

        $this->assertSame(Prescription::STATUS_FILLED, $rx->fresh()->status);
    }

    public function test_expire_prescriptions_command_blocks_past_expiry(): void
    {
        $patient = $this->createUser();
        $rx = $this->makePrescription($patient, [
            'expires_at' => now()->subDay(),
        ]);

        $this->artisan('pharmacy:expire-prescriptions')->assertSuccessful();

        $this->assertSame(Prescription::STATUS_EXPIRED, $rx->fresh()->status);
    }

    public function test_patient_prescription_index_is_scoped_to_own_rows(): void
    {
        $mine = $this->createUser();
        $other = $this->createUser();
        $this->makePrescription($mine);
        $this->makePrescription($other);

        $res = $this->actingAs($mine, 'sanctum')->getJson('/api/prescriptions');

        $res->assertOk();
        $this->assertSame([$mine->id], collect($res->json('data'))->pluck('patient_id')->unique()->all());
    }

    public function test_admin_prescription_oversight_requires_pharmacy_role(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum')->getJson('/api/admin/pharmacy/prescriptions')->assertStatus(403);
    }

    public function test_admin_prescription_oversight_lists_all_patients(): void
    {
        $patient = $this->createUser();
        $admin = $this->createAdmin();
        $this->makePrescription($patient);
        $this->makePrescription($patient, ['code' => 'RX-OTHER']);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/pharmacy/prescriptions');

        $res->assertOk();
        $this->assertGreaterThanOrEqual(2, count($res->json('data')));
    }

    public function test_ordering_reports_unmatched_prescription_items(): void
    {
        $patient = $this->createUser();
        $this->makeMedicine(['name' => 'Amoxicillin']);
        $rx = $this->makePrescription($patient);

        $res = $this->actingAs($patient, 'sanctum')
            ->postJson("/api/prescriptions/{$rx->id}/order", [
                'items' => [
                    ['name' => 'Amoxicillin'],
                    ['name' => 'Nonexistent Drug'],
                ],
            ]);

        $res->assertStatus(201);
        $this->assertSame(['Nonexistent Drug'], $res->json('unmatched'));
    }
}
