<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Pharmacy\Entities\Prescription;

/**
 * H-B: prescription lifecycle demo data for the customer account.
 *
 * Seeds an active prescription (send-to-pharmacy enabled), an expired one
 * (blocked from ordering), and a filled one that is linked to a delivered
 * medicine order, so the admin Prescriptions tab and the patient records
 * page have real rows across every status.
 */
class PrescriptionLifecycleSeeder extends Seeder
{
    public function run(): void
    {
        $buyer = User::where('email', 'customer@everythingneed.com')->first();
        if ($buyer === null) {
            return;
        }

        $now = now();

        $active = Prescription::firstOrCreate(
            ['code' => 'RX-LIFECYCLE-ACTIVE'],
            [
                'patient_id' => $buyer->id,
                'items' => [
                    ['name' => 'Amoxicillin', 'dosage' => '500mg', 'frequency' => 'three times daily', 'duration' => '7 days'],
                ],
                'status' => Prescription::STATUS_ACTIVE,
                'notes' => 'Active demo prescription — send to pharmacy enabled.',
                'expires_at' => $now->copy()->addDays(30),
            ]
        );

        Prescription::firstOrCreate(
            ['code' => 'RX-LIFECYCLE-EXPIRED'],
            [
                'patient_id' => $buyer->id,
                'items' => [
                    ['name' => 'Metformin', 'dosage' => '500mg', 'frequency' => 'twice daily', 'duration' => '30 days'],
                ],
                'status' => Prescription::STATUS_ACTIVE,
                'notes' => 'Expired demo prescription — ordering blocked.',
                'expires_at' => $now->copy()->subDays(5),
            ]
        );

        $filled = Prescription::firstOrCreate(
            ['code' => 'RX-LIFECYCLE-FILLED'],
            [
                'patient_id' => $buyer->id,
                'items' => [
                    ['name' => 'Lisinopril', 'dosage' => '10mg', 'frequency' => 'once daily', 'duration' => '30 days'],
                ],
                'status' => Prescription::STATUS_ACTIVE,
                'notes' => 'Demo prescription fulfilled by a delivered order.',
                'expires_at' => $now->copy()->addDays(60),
            ]
        );

        $this->linkDeliveredOrder($buyer->id, $filled, 'Lisinopril', 1, $now->copy()->subDays(2));

        // Keep the stored status honest with expires_at (same sweep the
        // scheduled pharmacy:expire-prescriptions command performs).
        Prescription::where('status', Prescription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $now)
            ->update(['status' => Prescription::STATUS_EXPIRED, 'updated_at' => $now]);
    }

    private function linkDeliveredOrder(string $buyerId, Prescription $prescription, string $medicineName, int $qty, \DateTimeInterface $at): void
    {
        if (MedicineOrder::where('prescription_id', $prescription->id)->exists()) {
            return;
        }

        $medicine = Medicine::where('name', $medicineName)->first();
        if ($medicine === null) {
            return;
        }

        $order = MedicineOrder::create([
            'user_id' => $buyerId,
            'order_number' => 'MED-DEMO-RXLINK',
            'delivery_address' => '14 Demo Street, Lagos',
            'prescription_id' => $prescription->id,
            'total_amount' => (float) $medicine->price * $qty,
            'status' => MedicineOrder::STATUS_DELIVERED,
            'created_at' => $at,
            'updated_at' => $at,
        ]);

        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => $qty,
            'unit_price' => $medicine->price,
        ]);

        $prescription->update(['status' => Prescription::STATUS_FILLED]);
    }
}
