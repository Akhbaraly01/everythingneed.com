<?php

namespace Tests\Feature\Payments;

use Tests\TestCase;
use App\Models\User;
use Modules\Payments\Entities\Payment;

class PaymentTest extends TestCase
{
    public function test_unauthenticated_user_cannot_list_payments(): void
    {
        $response = $this->getJson('/api/payments');

        $response->assertStatus(401);
    }

    public function test_user_can_list_own_payments(): void
    {
        $user = $this->createUser();

        Payment::create([
            'user_id' => $user->id,
            'amount' => 25.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-TEST001',
        ]);

        Payment::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'currency' => 'USD',
            'status' => 'pending',
            'method' => 'paypal',
            'reference' => 'PAY-TEST002',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'amount', 'currency', 'status', 'method', 'reference'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_only_sees_own_payments(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        Payment::create([
            'user_id' => $user1->id,
            'amount' => 10.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-U1-001',
        ]);

        Payment::create([
            'user_id' => $user2->id,
            'amount' => 99.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-U2-001',
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/payments');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('PAY-U1-001', $response->json('data.0.reference'));
    }

    public function test_user_can_view_own_payment(): void
    {
        $user = $this->createUser();

        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 30.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-VIEW-001',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/payments/{$payment->id}");

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $payment->id,
                'amount' => '30.00',
                'reference' => 'PAY-VIEW-001',
            ]);
    }

    public function test_view_nonexistent_payment_returns_404(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404)
            ->assertJsonFragment(['message' => 'Payment not found']);
    }

    public function test_user_can_charge_payment(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 99.99,
                'currency' => 'USD',
                'method' => 'card',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Payment charged successfully'])
            ->assertJsonStructure([
                'data' => ['id', 'amount', 'currency', 'status', 'method', 'reference'],
            ]);

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'amount' => 99.99,
            'currency' => 'USD',
            'method' => 'card',
            'status' => 'succeeded',
        ]);
    }

    public function test_charge_requires_amount(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'method' => 'card',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_charge_requires_method(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 25.00,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['method']);
    }

    public function test_charge_rejects_zero_amount(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 0,
                'method' => 'card',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_charge_rejects_negative_amount(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => -10,
                'method' => 'card',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_charge_with_order_id(): void
    {
        $user = $this->createUser();
        $orderId = \Illuminate\Support\Str::uuid()->toString();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'order_id' => $orderId,
                'amount' => 45.00,
                'currency' => 'USD',
                'method' => 'wallet',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'order_id' => $orderId,
            'amount' => 45.00,
            'method' => 'wallet',
        ]);
    }

    public function test_charge_default_currency_is_usd(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 10.00,
                'method' => 'card',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'currency' => 'USD',
        ]);
    }

    public function test_unauthenticated_user_cannot_charge(): void
    {
        $response = $this->postJson('/api/payments/charge', [
            'amount' => 25.00,
            'method' => 'card',
        ]);

        $response->assertStatus(401);
    }

    public function test_partial_refund_via_service(): void
    {
        $admin = $this->actingAsAdmin();

        $payment = Payment::create([
            'user_id' => $admin->id,
            'amount' => 100.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-REFUND-001',
        ]);

        $refundService = app(\Modules\Payments\Actions\RefundPayment::class);
        $refund = $refundService->execute($payment->id, 50.00);

        $this->assertEquals(50.00, (float) $refund->amount);
        $this->assertEquals('completed', $refund->status);

        $payment->refresh();
        $this->assertEquals('partially_refunded', $payment->status);
    }

    public function test_full_refund_via_service(): void
    {
        $admin = $this->actingAsAdmin();

        $payment = Payment::create([
            'user_id' => $admin->id,
            'amount' => 200.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-FULLREFUND-001',
        ]);

        $refundService = app(\Modules\Payments\Actions\RefundPayment::class);
        $refund = $refundService->execute($payment->id);

        $this->assertEquals(200.00, (float) $refund->amount);
        $this->assertEquals('completed', $refund->status);

        $payment->refresh();
        $this->assertEquals('refunded', $payment->status);
    }

    public function test_refund_nonexistent_payment_throws(): void
    {
        $refundService = app(\Modules\Payments\Actions\RefundPayment::class);

        $this->expectException(\Core\Exceptions\NotFoundException::class);
        $refundService->execute('00000000-0000-0000-0000-000000000000', 50.00);
    }

    public function test_refund_pending_payment_throws(): void
    {
        $user = $this->createUser();

        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'currency' => 'USD',
            'status' => 'pending',
            'method' => 'card',
            'reference' => 'PAY-PENDING-001',
        ]);

        $refundService = app(\Modules\Payments\Actions\RefundPayment::class);

        $this->expectException(\Core\Exceptions\ValidationException::class);
        $refundService->execute($payment->id, 50.00);
    }

    public function test_refund_exceeding_amount_throws(): void
    {
        $user = $this->createUser();

        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-EXCEED-001',
        ]);

        $refundService = app(\Modules\Payments\Actions\RefundPayment::class);

        $this->expectException(\Core\Exceptions\ValidationException::class);
        $refundService->execute($payment->id, 100.00);
    }

    public function test_payments_are_paginated(): void
    {
        $user = $this->createUser();

        for ($i = 1; $i <= 20; $i++) {
            Payment::create([
                'user_id' => $user->id,
                'amount' => $i,
                'currency' => 'USD',
                'status' => 'succeeded',
                'method' => 'card',
                'reference' => "PAY-PAGE-{$i}",
            ]);
        }

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments?per_page=5');

        $response->assertOk();
        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(4, $response->json('meta.last_page'));
        $this->assertEquals(20, $response->json('meta.total'));
    }

    public function test_charge_generates_unique_reference(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 10.00,
                'method' => 'card',
            ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/charge', [
                'amount' => 20.00,
                'method' => 'card',
            ]);

        $payments = Payment::where('user_id', $user->id)->get();
        $this->assertCount(2, $payments);
        $this->assertNotEquals(
            $payments->first()->reference,
            $payments->last()->reference
        );
    }

    public function test_list_endpoint_only_returns_own_payments(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        Payment::create([
            'user_id' => $user2->id,
            'amount' => 77.00,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-PRIVATE-001',
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/payments');

        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
