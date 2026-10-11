<?php

namespace Tests\Feature\WaveU;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Quiz;
use Tests\TestCase;

/**
 * Wave U — spec §97 Phase F end-to-end workflows: unbroken chains
 * healthcare (find → book → consult → review), learning (browse →
 * certificate), wallet (KYC → withdrawal with ledger), and commerce
 * (order → fulfilment → review).
 */
class WaveUWorkflowTest extends TestCase
{
    private function verifyKyc(object $user): void
    {
        DB::table('kyc_verifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'attempts' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_healthcare_chain_find_book_consult_review(): void
    {
        $admin = $this->createUser();
        $this->assignRole($admin, 'healthcare_admin');
        $this->actingAs($admin, 'sanctum');

        $doctorId = $this->postJson('/api/doctors', [
            'full_name' => 'WaveU Doctor',
            'specialization' => 'Cardiology',
            'profession' => 'doctor',
            'qualification' => 'MD',
            'experience_years' => 10,
            'consultation_fee' => 50,
        ])->assertStatus(201)->json('data.id');

        // Link the roster row to a real doctor account (enables the
        // doctor-completes-own path via User::doctor()).
        $doctorUser = $this->createUser();
        DB::table('doctors')->where('id', $doctorId)->update(['user_id' => $doctorUser->id]);

        $patient = $this->createUser();
        $this->actingAs($patient, 'sanctum');

        // Find → view → availability.
        $found = $this->getJson('/api/doctors?q=WaveU')->assertOk()->json('data');
        $this->assertContains($doctorId, collect($found)->pluck('id')->all());
        $this->getJson('/api/doctors/' . $doctorId)->assertOk();
        $this->getJson('/api/doctors/' . $doctorId . '/availability')->assertOk();

        // Book → start → complete (by the assigned doctor).
        $ticketId = $this->postJson('/api/appointments', [
            'doctor_id' => $doctorId,
            'symptoms' => 'WaveU checkup',
            'appointment_date' => now()->addDays(2)->toDateString(),
        ])->assertStatus(201)->json('data.id');

        $this->actingAs($doctorUser, 'sanctum');
        $this->postJson('/api/appointments/' . $ticketId . '/start')->assertOk();
        $this->postJson('/api/appointments/' . $ticketId . '/complete', [
            'diagnosis' => 'Healthy',
        ])->assertOk();
        $this->assertSame(
            'completed',
            DB::table('health_tickets')->where('id', $ticketId)->value('status')
        );

        // The patient can never close consultations themselves.
        $this->actingAs($patient, 'sanctum');
        $this->postJson('/api/appointments/' . $ticketId . '/complete', ['diagnosis' => 'x'])
            ->assertStatus(403);

        // Review the doctor.
        $reviewId = $this->postJson('/api/reviews', [
            'reviewable_type' => 'doctor',
            'reviewable_id' => $doctorId,
            'rating' => 5,
            'comment' => 'Thorough WaveU checkup',
        ])->assertStatus(201)->json('data.id');
        $this->assertSame(
            5,
            (int) DB::table('reviews')->where('id', $reviewId)->value('rating')
        );
    }

    public function test_learning_chain_browse_enroll_quiz_certificate(): void
    {
        $course = Course::factory()->create(['title' => 'WaveU Chain Course']);
        $lesson = CourseLesson::create([
            'course_id' => $course->id,
            'title' => 'Only lesson',
            'lesson_order' => 1,
        ]);
        $quiz = Quiz::create([
            'course_id' => $course->id,
            'title' => 'Final quiz',
            'questions' => [
                ['id' => 'q1', 'question' => '2+2?', 'options' => ['3', '4'], 'correct_index' => 1],
            ],
            'pass_score_percent' => 70,
        ]);

        $student = $this->createUser();
        $this->actingAs($student, 'sanctum');

        // Browse → enroll.
        $listed = $this->getJson('/api/courses?q=WaveU Chain')->assertOk()->json('data');
        $this->assertContains($course->id, collect($listed)->pluck('id')->all());
        $this->postJson('/api/courses/' . $course->id . '/enroll')->assertStatus(201);

        // Lesson → quiz → certificate → public verification.
        $this->postJson("/api/learn/courses/{$course->id}/lessons/{$lesson->id}/complete", [])
            ->assertOk();
        $this->postJson("/api/quizzes/{$quiz->id}/submit", ['answers' => ['q1' => '1']])
            ->assertStatus(200)
            ->assertJsonPath('data.passed', true);

        $code = $this->postJson("/api/learn/courses/{$course->id}/certificate", [])
            ->assertStatus(201)
            ->json('data.certificate_number');
        $this->assertStringStartsWith('CERT-', $code);
        $this->getJson("/api/learn/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('data.valid', true);
    }

    public function test_wallet_chain_kyc_deposit_purchase_withdraw(): void
    {
        $user = $this->createUser();
        $this->verifyKyc($user);
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/wallet/deposit', ['amount' => 1000, 'payment_method' => 'card'])
            ->assertStatus(200);
        $this->postJson('/api/bills/purchase', [
            'service' => 'airtime',
            'country' => 'NG',
            'currency' => 'NGN',
            'amount' => 100,
            'account_fields' => ['phone' => '+2348012345678', 'network' => 'MTN'],
        ])->assertStatus(201);
        $this->postJson('/api/wallet/withdraw', ['amount' => 200])->assertStatus(200);

        $this->assertSame(700.0, (float) DB::table('wallets')->where('user_id', $user->id)->value('balance'));

        $ledger = $this->getJson('/api/wallet/transactions')->assertOk()->json('data');
        $this->assertGreaterThanOrEqual(3, count($ledger));
    }

    public function test_commerce_chain_order_fulfil_review(): void
    {
        $vendorUser = $this->createUser();
        $this->assignRole($vendorUser, 'vendor_admin');
        $shop = $this->createVendor($vendorUser, ['store_name' => 'WaveU Shop']);

        $productId = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $productId,
            'vendor_id' => $shop->id,
            'name' => 'WaveU Chain Gizmo',
            'description' => 'x',
            'category' => 'misc',
            'price' => 50,
            'stock_quantity' => 5,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum');
        $orderId = $this->postJson('/api/product-orders', [
            'items' => [['product_id' => $productId, 'quantity' => 1]],
            'shipping_address' => '1 Test Way',
        ])->assertStatus(201)->json('data.id');

        $rowId = DB::table('vendor_orders')->where('order_id', $orderId)->value('id');
        $this->assertNotNull($rowId);

        // Payment unlocks fulfilment (unpaid orders cannot be accepted).
        $this->postJson('/api/payments/charge', [
            'order_id' => $orderId,
            'amount' => 50,
            'method' => 'card',
        ])->assertStatus(201);

        $this->actingAs($vendorUser, 'sanctum');
        foreach (['accept', 'ship', 'deliver'] as $action) {
            $this->postJson("/api/vendor/orders/{$rowId}/{$action}")->assertOk();
        }

        $this->actingAs($customer, 'sanctum');
        $reviewId = $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => $productId,
            'rating' => 5,
            'comment' => 'Arrived fast, works great',
        ])->assertStatus(201)->json('data.id');

        $this->assertSame(
            $productId,
            (string) DB::table('reviews')->where('id', $reviewId)->value('reviewable_id')
        );
        $this->assertSame(
            4,
            (int) DB::table('products')->where('id', $productId)->value('stock_quantity')
        );
    }
}
