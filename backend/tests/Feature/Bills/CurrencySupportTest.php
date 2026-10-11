<?php

namespace Tests\Feature\Bills;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * W18 (F-03): money inputs share one supported-currency list
 * (`Core\Support\Currencies`) and normalize case server-side.
 *
 * Pins: lowercase codes are normalized, unknown codes are 422, and no
 * previously accepted option is rejected (union of the frontend lists).
 */
class CurrencySupportTest extends TestCase
{
    use RefreshDatabase;

    private function verifiedUser(): object
    {
        $user = $this->createUser();
        DB::table('kyc_verifications')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'status' => 'approved',
            'attempts' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $user;
    }

    private function billPayload(array $overrides = []): array
    {
        return array_merge([
            'service' => 'airtime',
            'country' => 'NG',
            'currency' => 'NGN',
            'amount' => 100,
            'account_fields' => ['phone' => '+2348012345678', 'network' => 'MTN'],
        ], $overrides);
    }

    private function needPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Currency fixture request',
            'description' => 'Fixture description for the currency test.',
            'budget_min' => 10,
            'budget_max' => 20,
        ], $overrides);
    }

    public function test_bill_currency_is_normalized_and_unknown_codes_rejected(): void
    {
        $user = $this->verifiedUser();
        $this->actingAs($user, 'sanctum');
        $this->postJson('/api/wallet/deposit', ['amount' => 100000, 'payment_method' => 'card'])
            ->assertStatus(200);

        // 'ngn' normalizes to NGN and the purchase completes end-to-end.
        $this->postJson('/api/bills/purchase', $this->billPayload(['currency' => 'ngn']))
            ->assertStatus(201);

        $this->assertDatabaseHas('bill_purchases', ['currency' => 'NGN']);

        // Unknown codes are rejected at the request layer...
        $bad = $this->postJson('/api/bills/purchase', $this->billPayload(['currency' => 'XXX']));
        $bad->assertStatus(422);
        $bad->assertJsonValidationErrors('currency');

        // ...while a catalog-unavailable code fails downstream of
        // validation (currency list passes, catalog says unavailable).
        $unavailable = $this->postJson('/api/bills/purchase', $this->billPayload(['currency' => 'EUR']));
        $unavailable->assertStatus(422);
        $this->assertArrayNotHasKey('currency', $unavailable->json('errors', []));
    }

    public function test_need_request_currency_is_normalized_and_whitelisted(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/need-requests', $this->needPayload(['currency' => 'ghs']))
            ->assertStatus(201);

        $this->assertDatabaseHas('need_requests', [
            'title' => 'Currency fixture request',
            'currency' => 'GHS',
        ]);

        $this->postJson('/api/need-requests', $this->needPayload(['currency' => 'XXX', 'title' => 'Bad currency']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('currency');
    }

    public function test_every_supported_code_is_accepted_on_need_requests(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        foreach (\Core\Support\Currencies::SUPPORTED as $i => $code) {
            $title = "Currency union {$code}";
            $this->postJson('/api/need-requests', $this->needPayload([
                'title' => $title,
                'currency' => strtolower($code),
            ]))->assertStatus(201);

            $this->assertDatabaseHas('need_requests', [
                'title' => $title,
                'currency' => $code,
            ]);
        }
    }
}
