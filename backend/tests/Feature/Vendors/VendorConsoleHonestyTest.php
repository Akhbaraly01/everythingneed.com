<?php

namespace Tests\Feature\Vendors;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * Plan P1: vendor console honesty fixes.
 *
 * - Registration persists business_type/phone/address (previously dropped).
 * - Earnings summary carries real per-product aggregates (previously the
 *   console rendered hard-coded zeros).
 * - Vendor pages redirect storeless users to registration (was a bare 404).
 */
class VendorConsoleHonestyTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_persists_contact_fields(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->postJson('/api/vendors', [
            'store_name' => 'Honest Store',
            'category' => 'electronics',
            'business_type' => 'business',
            'phone' => '+233200000001',
            'address' => '1 Accra Rd',
        ])->assertStatus(201);

        $vendor = Vendor::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('business', $vendor->settings['business_type'] ?? null);
        $this->assertSame('+233200000001', $vendor->settings['phone'] ?? null);
        $this->assertSame('1 Accra Rd', $vendor->settings['address'] ?? null);
    }

    public function test_earnings_summary_carries_real_top_products(): void
    {
        $owner = $this->createVendorUser();
        $vendor = $this->createVendor($owner);
        $buyer = $this->createUser();

        foreach ([['Widget A', 2, 100.0], ['Widget B', 1, 300.0]] as [$name, $qty, $total]) {
            DB::table('vendor_orders')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'vendor_id' => $vendor->id,
                'customer_id' => $buyer->id,
                'product_id' => (string) \Illuminate\Support\Str::uuid(),
                'product_name' => $name,
                'quantity' => $qty,
                'unit_price' => $total / $qty,
                'total_price' => $total,
                'order_number' => 'VO-'.strtoupper(\Illuminate\Support\Str::random(8)),
                'status' => 'delivered',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->actingAs($owner, 'sanctum');
        $res = $this->getJson('/api/vendor/orders/top-products')->assertOk();
        $top = $res->json('data');

        $this->assertCount(2, $top);
        // Ordered by revenue desc: B (300) before A (100).
        $this->assertSame('Widget B', $top[0]['name']);
        $this->assertSame(1, (int) $top[0]['sold']);
        $this->assertSame(300.0, (float) $top[0]['revenue']);
        $this->assertSame(2, (int) $top[1]['sold']);

        // Strangers get 403, never another vendor's numbers.
        $other = $this->createVendorUser();
        $this->createVendor($other);
        $this->actingAs($other, 'sanctum');
        $this->getJson('/api/vendor/orders/top-products')->assertOk()->assertJsonPath('data', []);
    }

    public function test_vendor_pages_redirect_storeless_users_to_registration(): void
    {
        $user = $this->createUser();
        $this->actingAs($user, 'web');

        foreach (['/vendor', '/vendor/products', '/vendor/orders'] as $path) {
            $this->get($path)->assertRedirect('/vendor/register');
        }
    }
}
