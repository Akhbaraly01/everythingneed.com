<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\LabBooking;
use Modules\Healthcare\Entities\LabTest;

/**
 * W13 healthcare demo data: three health tickets for the canonical
 * customer account across the ticket lifecycle (assigned,
 * in_consultation, cancelled) plus a real lab-test catalog and one
 * lab booking. Idempotent (HT-DEMO-* / LB-DEMO-* numbers, slug keys).
 */
class HealthcareDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        if (!$customer) {
            return;
        }

        $cardio = \DB::table('doctors')->where('specialization', 'Cardiology')->first();
        $neuro = \DB::table('doctors')->where('specialization', 'Neurology')->first();

        $this->seed('HT-DEMO-1', $customer->id, $cardio?->id, 'assigned', 'virtual', 'DEMO: recurring chest tightness after climbing stairs.', 150, now()->addDays(3));
        $this->seed('HT-DEMO-2', $customer->id, $neuro?->id, 'in_consultation', 'virtual', 'DEMO: persistent migraine episodes.', 200, now()->subDay());
        $this->seed('HT-DEMO-3', $customer->id, $cardio?->id, 'cancelled', 'in_person', 'DEMO: routine check-up (patient rescheduled).', 150, now()->addDays(7));

        $this->seedLabTests();
        $this->seedLabBooking($customer->id);
    }

    /** A small real catalog so /healthcare/labs is not empty. */
    private function seedLabTests(): void
    {
        $tests = [
            ['name' => 'Complete Blood Count (CBC)', 'category' => 'Hematology', 'price' => 25, 'prep' => 'Fast 8-10 hours beforehand. Drink water.', 'result_time_hours' => 24, 'description' => 'Measures red and white blood cells, hemoglobin, hematocrit and platelets.'],
            ['name' => 'Lipid Panel', 'category' => 'Chemistry', 'price' => 35, 'prep' => 'Fast 9-12 hours beforehand. Avoid alcohol 24h prior.', 'result_time_hours' => 24, 'description' => 'Total cholesterol, LDL, HDL and triglycerides to assess cardiovascular risk.'],
            ['name' => 'Hemoglobin A1C', 'category' => 'Chemistry', 'price' => 30, 'prep' => 'No fasting required.', 'result_time_hours' => 48, 'description' => 'Average blood sugar over the past 2-3 months; used to screen for diabetes.'],
            ['name' => 'Thyroid Panel (TSH, T3, T4)', 'category' => 'Endocrinology', 'price' => 45, 'prep' => 'No fasting required. Take thyroid medication as usual.', 'result_time_hours' => 48, 'description' => 'Assesses thyroid gland function.'],
            ['name' => 'Urinalysis', 'category' => 'Urinalysis', 'price' => 15, 'prep' => 'Collect a mid-stream morning sample.', 'result_time_hours' => 12, 'description' => 'Screens for urinary tract infections, kidney disease and diabetes.'],
            ['name' => 'Vitamin D, 25-Hydroxy', 'category' => 'Vitamins', 'price' => 40, 'prep' => 'No fasting required.', 'result_time_hours' => 72, 'description' => 'Measures vitamin D level to assess bone health and deficiency.'],
        ];

        foreach ($tests as $t) {
            LabTest::firstOrCreate(
                ['slug' => Str::slug($t['name'])],
                [
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'category' => $t['category'],
                    'price' => $t['price'],
                    'preparation_instructions' => $t['prep'],
                    'result_time_hours' => $t['result_time_hours'],
                    'is_active' => true,
                ]
            );
        }
    }

    /** One paid lab booking for the customer so history is not empty. */
    private function seedLabBooking(string $patientId): void
    {
        $cbc = LabTest::where('slug', Str::slug('Complete Blood Count (CBC)'))->first();
        if (!$cbc) {
            return;
        }

        LabBooking::firstOrCreate(
            ['booking_number' => 'LB-DEMO-1'],
            [
                'patient_id' => $patientId,
                'lab_test_id' => $cbc->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'appointment_time' => '10:00',
                'price' => $cbc->price,
                'status' => LabBooking::STATUS_CONFIRMED,
                'is_paid' => true,
                'payment_reference' => 'DEMO-PAY-1',
            ]
        );
    }

    private function seed(
        string $ticketNumber,
        string $patientId,
        ?string $doctorId,
        string $status,
        string $consultationType,
        string $symptoms,
        float $fee,
        \DateTimeInterface $appointmentDate
    ): void {
        HealthTicket::firstOrCreate(
            ['ticket_number' => $ticketNumber],
            [
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'symptoms' => $symptoms,
                'consultation_type' => $consultationType,
                'consultation_fee' => $fee,
                'appointment_date' => $appointmentDate->format('Y-m-d'),
                'appointment_time' => '09:00',
                'is_random_assignment' => $doctorId === null,
                'status' => $status,
            ]
        );
    }
}
