<?php

namespace Tests\Feature\Pharmacy;

use App\Models\User;
use App\Models\UserRole;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Pharmacy\Entities\Medicine;
use Tests\TestCase;

/**
 * W4 pharmacy fulfillment: pending -> confirmed -> processing -> shipped
 * -> delivered, illegal jumps rejected, cancellation restocks, and the
 * console endpoints are role-gated.
 */
class PharmacyFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => fake()->words(3, true),
            'category' => 'painkillers',
            'price' => 10.00,
            'stock_quantity' => 10,
        ], $overrides));
    }

    private function pharmacyAdmin(): User
    {
        $admin = User::factory()->create();
        UserRole::create(['user_id' => $admin->id, 'role' => 'pharmacy_admin']);
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'sanctum');

        return $admin;
    }

    private function placeOrder(User $user, Medicine $medicine, int $qty = 2): string
    {
        $this->app['auth']->forgetGuards();
        $this->actingAs($user, 'sanctum');

        return $this->postJson('/api/pharmacy/orders', [
            'items' => [['medicine_id' => $medicine->id, 'quantity' => $qty]],
            'delivery_address' => '1 Test St',
        ])->assertStatus(201)->json('data.id');
    }

    public function test_full_fulfillment_journey(): void
    {
        $medicine = $this->makeMedicine();
        $customer = User::factory()->create();
        $orderId = $this->placeOrder($customer, $medicine, 2);

        $this->assertSame(8, $medicine->fresh()->stock_quantity);
        $this->pharmacyAdmin();

        foreach ([
            ['confirm', 'confirmed'],
            ['process', 'processing'],
            ['ship', 'shipped'],
            ['deliver', 'delivered'],
        ] as [$action, $status]) {
            $this->postJson("/api/admin/pharmacy/orders/{$orderId}/{$action}")
                ->assertOk()
                ->assertJsonPath('data.status', $status);
        }

        $this->assertSame('delivered', MedicineOrder::find($orderId)->status);
    }

    public function test_illegal_jumps_are_rejected(): void
    {
        $medicine = $this->makeMedicine();
        $customer = User::factory()->create();
        $orderId = $this->placeOrder($customer, $medicine);
        $this->pharmacyAdmin();

        // pending -> ship skips confirmation stages.
        $this->postJson("/api/admin/pharmacy/orders/{$orderId}/ship")
            ->assertStatus(422);

        // Unknown order.
        $this->postJson('/api/admin/pharmacy/orders/11111111-1111-1111-1111-111111111111/confirm')
            ->assertNotFound();
    }

    public function test_cancel_restocks_and_terminal_orders_stay_put(): void
    {
        $medicine = $this->makeMedicine();
        $customer = User::factory()->create();
        $orderId = $this->placeOrder($customer, $medicine, 3);
        $this->assertSame(7, $medicine->fresh()->stock_quantity);

        $this->pharmacyAdmin();
        $this->postJson("/api/admin/pharmacy/orders/{$orderId}/confirm")->assertOk();
        $this->postJson("/api/admin/pharmacy/orders/{$orderId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(10, $medicine->fresh()->stock_quantity);

        // Delivered orders cannot be cancelled.
        $orderId2 = $this->placeOrder($customer, $medicine, 1);
        $this->pharmacyAdmin();
        foreach (['confirm', 'process', 'ship', 'deliver'] as $action) {
            $this->postJson("/api/admin/pharmacy/orders/{$orderId2}/{$action}")->assertOk();
        }
        $this->postJson("/api/admin/pharmacy/orders/{$orderId2}/cancel")->assertStatus(422);
    }

    public function test_fulfillment_console_is_role_gated(): void
    {
        $medicine = $this->makeMedicine();
        $customer = User::factory()->create();
        $orderId = $this->placeOrder($customer, $medicine);

        // Guest -> 401.
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/admin/pharmacy/orders/{$orderId}/confirm")->assertUnauthorized();

        // Plain user (no console role) -> 403.
        $this->actingAs($customer, 'sanctum');
        $this->postJson("/api/admin/pharmacy/orders/{$orderId}/confirm")->assertForbidden();
    }
}
