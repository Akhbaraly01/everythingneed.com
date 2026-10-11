<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Pharmacy\Entities\Prescription;

/**
 * W4: pharmacy demo vertical. Tops up the medicine catalogue, then places
 * one demo order per lifecycle status (pending/confirmed/processing/
 * shipped/delivered/cancelled) for the canonical customer account so the
 * fulfillment console and the customer order pages have real rows.
 * Idempotent: medicines keyed by name, orders skipped when demo rows exist.
 */
class PharmacyDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCatalogue();

        if (MedicineOrder::where('order_number', 'like', 'MED-DEMO-%')->exists()) {
            return;
        }

        $buyer = User::where('email', 'customer@everythingneed.com')->first();
        if ($buyer === null) {
            return;
        }

        $now = now();
        $specs = [
            ['status' => 'pending', 'days' => 0, 'items' => ['Paracetamol' => 2]],
            ['status' => 'confirmed', 'days' => 1, 'items' => ['Ibuprofen' => 1, 'Cetirizine' => 1]],
            ['status' => 'processing', 'days' => 2, 'items' => ['Omeprazole' => 1]],
            ['status' => 'shipped', 'days' => 4, 'items' => ['Paracetamol' => 1, 'Cetirizine' => 2]],
            ['status' => 'delivered', 'days' => 7, 'items' => ['Ibuprofen' => 2]],
            ['status' => 'cancelled', 'days' => 3, 'items' => ['Cetirizine' => 1]],
        ];

        $n = 0;
        foreach ($specs as $spec) {
            $n++;
            $this->placeDemoOrder($buyer->id, "MED-DEMO-{$n}", $spec['status'], $spec['items'], $now->copy()->subDays($spec['days']));
        }

        // One prescription-backed delivered order (Amoxicillin requires it).
        Prescription::firstOrCreate(
            ['code' => 'RX-DEMO-1'],
            [
                'patient_id' => $buyer->id,
                'doctor_id' => null,
                'consultation_id' => null,
                'items' => ['Amoxicillin'],
                'status' => Prescription::STATUS_ACTIVE,
                'notes' => 'Demo prescription for seeded orders.',
            ]
        );

        $this->placeDemoOrder($buyer->id, 'MED-DEMO-RX', 'delivered', ['Amoxicillin' => 1], $now->copy()->subDays(9));
    }

    private function seedCatalogue(): void
    {
        $rows = [
            ['Vitamin C', 'Ascorbic Acid', 'Vitamins', 'Daily immune support chewables', 6.49, false, 400, 'tablets', '500mg', 'HealthPlus'],
            ['Multivitamin', 'Multivitamin Complex', 'Vitamins', 'One-a-day complete formula', 11.99, false, 320, 'tablets', null, 'HealthPlus'],
            ['Bandage Roll', null, 'First Aid', 'Sterile gauze bandage roll', 3.25, false, 150, 'roll', null, 'SafeCare'],
            ['Antiseptic Liquid', 'Chlorhexidine', 'First Aid', 'Wound cleaning antiseptic', 4.75, false, 180, 'bottle', '250ml', 'SafeCare'],
            ['Baby Lotion', null, 'Baby Care', 'Gentle moisturizing baby lotion', 5.50, false, 120, 'bottle', '200ml', 'TenderTot'],
            ['Eye Drops', 'Carboxymethylcellulose', 'Eye Care', 'Lubricating drops for dry eyes', 7.25, false, 90, 'bottle', '10ml', 'ClearView'],
            ['Metformin', 'Metformin HCl', 'Diabetes', 'Blood sugar control tablets', 9.50, true, 140, 'tablets', '500mg', 'GlucoCare'],
            ['Lisinopril', 'Lisinopril', 'Hypertension', 'ACE inhibitor blood pressure tablets', 13.75, true, 110, 'tablets', '10mg', 'CardioMed'],
            ['Salbutamol Inhaler', 'Salbutamol', 'Asthma', 'Relief inhaler for asthma attacks', 15.99, true, 60, 'inhaler', '100mcg', 'BreatheEasy'],
            ['Zinc Tablets', 'Zinc Gluconate', 'Vitamins', 'Immune and skin support, low stock demo', 4.99, false, 8, 'tablets', '15mg', 'HealthPlus'],
        ];

        foreach ($rows as [$name, $generic, $category, $desc, $price, $rx, $stock, $form, $strength, $maker]) {
            if (Medicine::where('name', $name)->exists()) {
                continue;
            }
            Medicine::create([
                'name' => $name,
                'generic_name' => $generic,
                'category' => $category,
                'description' => $desc,
                'price' => $price,
                'requires_prescription' => $rx,
                'stock_quantity' => $stock,
                'dosage_form' => $form,
                'strength' => $strength,
                'manufacturer' => $maker,
            ]);
        }
    }

    /**
     * @param array<string, int> $items name => qty
     */
    private function placeDemoOrder(string $buyerId, string $number, string $status, array $items, \DateTimeInterface $at): void
    {
        DB::transaction(function () use ($buyerId, $number, $status, $items, $at) {
            $total = 0;
            $lines = [];
            foreach ($items as $name => $qty) {
                $medicine = Medicine::where('name', $name)->lockForUpdate()->first();
                if ($medicine === null || $medicine->stock_quantity < $qty) {
                    return;
                }
                $total += (float) $medicine->price * $qty;
                $lines[] = [$medicine, $qty];
            }

            $order = MedicineOrder::create([
                'user_id' => $buyerId,
                'order_number' => $number,
                'delivery_address' => '14 Demo Street, Lagos',
                'total_amount' => $total,
                'status' => $status,
                'created_at' => $at,
                'updated_at' => $at,
            ]);

            foreach ($lines as [$medicine, $qty]) {
                MedicineOrderItem::create([
                    'order_id' => $order->id,
                    'medicine_id' => $medicine->id,
                    'quantity' => $qty,
                    'unit_price' => $medicine->price,
                ]);
                $medicine->decrement('stock_quantity', $qty);
            }
        });
    }
}
