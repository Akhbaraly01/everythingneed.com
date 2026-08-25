<?php

namespace Tests\Feature\Vendors;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class VendorPayoutTest extends TestCase
{
    use RefreshDatabase;

    private function vendorWithBalance(float $commissionTotal): array
    {
        $user = User::factory()->create();
        $vendorId = (string) \Illuminate\Support\Str::uuid();

        DB::table('vendors')->insert([
            'id' => $vendorId,
            'user_id' => $user->id,
            'store_name' => 'Payout Store',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($commissionTotal > 0) {
            DB::table('vendor_commissions')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'vendor_id' => $vendorId,
                'order_id' => (string) \Illuminate\Support\Str::uuid(),
                'amount' => $commissionTotal,
                'rate' => 0.10,
                'status' => 'cleared',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return [$user, $vendorId];
    }

    public function test_summary_reflects_earned_withdrawn_and_available(): void
    {
        [$user] = $this->vendorWithBalance(500);

        // A paid withdrawal of 200 leaves 300 available
        $vendorId = DB::table('vendors')->where('user_id', $user->id)->value('id');
        DB::table('vendor_withdrawals')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'vendor_id' => $vendorId,
            'amount' => 200,
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $res = $this->actingAs($user)->getJson('/api/vendor/earnings');
        $res->assertStatus(200);
        $this->assertEquals(500.0, $res->json('data.total_earned'));
        $this->assertEquals(200.0, $res->json('data.withdrawn'));
        $this->assertEquals(300.0, $res->json('data.available'));
    }

    public function test_vendor_can_request_payout_within_available_balance(): void
    {
        [$user] = $this->vendorWithBalance(400);

        $ok = $this->actingAs($user)->postJson('/api/vendor/payouts/request', [
            'amount' => 250,
        ]);
        $ok->assertStatus(201);

        // Second pending request blocked
        $dupe = $this->actingAs($user)->postJson('/api/vendor/payouts/request', [
            'amount' => 50,
        ]);
        $dupe->assertStatus(409);
    }

    public function test_payout_beyond_available_is_rejected(): void
    {
        [$user] = $this->vendorWithBalance(100);

        $this->actingAs($user)->postJson('/api/vendor/payouts/request', [
            'amount' => 999,
        ])->assertStatus(422);
    }

    public function test_non_vendors_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/vendor/earnings')
            ->assertStatus(403);
    }
}
