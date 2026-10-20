<?php

namespace Tests\Feature\Delivery;

use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;
use Modules\Orders\Entities\Order;
use Modules\Delivery\Entities\Delivery;
use Modules\Delivery\Entities\DeliveryManager;

/**
 * Admin console CRUD for delivery managers: the /admin/deliveries gate is
 * super_admin, administrator, transport_admin, platform_ops, orders_admin
 * (routes/web.php) - the API must match, plus the roster is no longer a
 * public listing.
 */
class DeliveryCrudTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function registerFor(\App\Models\User $user): string
    {
        return $this->actingAs($user, 'sanctum')
            ->postJson('/api/delivery/managers', [
                'full_name' => 'Managed Rider',
                'phone' => '+233201234567',
                'vehicle_type' => 'motorbike',
            ])->assertStatus(201)->json('data.id');
    }

    public function test_roster_is_staff_only(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/delivery/managers')->assertStatus(403);
    }

    public function test_transport_ops_roles_manage_the_roster(): void
    {
        foreach (['transport_admin', 'platform_ops', 'orders_admin'] as $role) {
            $ops = $this->createUser();
            $this->assignRole($ops, $role);
            $owner = $this->createUser();
            $id = $this->registerFor($owner);

            // Listing + restricted listing filters.
            $res = $this->actingAs($ops, 'sanctum')
                ->getJson('/api/delivery/managers')->assertOk();

            // Edit another rider's profile.
            $this->actingAs($ops, 'sanctum')
                ->putJson("/api/delivery/managers/{$id}", [
                    'full_name' => "Renamed By {$role}",
                    'phone' => '+233209000000',
                ])->assertOk()
                ->assertJsonPath('data.phone', '+233209000000');

            // Unreferenced managers can be removed.
            $this->actingAs($ops, 'sanctum')
                ->deleteJson("/api/delivery/managers/{$id}")->assertOk();
            $this->assertNull(DeliveryManager::find($id));
        }
    }

    public function test_delete_is_blocked_while_assignments_exist(): void
    {
        $ops = $this->createUser();
        $this->assignRole($ops, 'transport_admin');

        $owner = $this->createUser();
        $id = $this->registerFor($owner);

        $order = Order::create([
            'user_id' => $owner->id,
            'order_number' => 'EN-'.strtoupper(uniqid()),
            'status' => Order::STATUS_PAID,
            'subtotal' => 40,
            'total_amount' => 40,
            'shipping_address' => '1 Test Street',
        ]);
        Delivery::create([
            'order_id' => $order->id,
            'manager_id' => $id,
            'status' => Delivery::STATUS_ASSIGNED,
            'assigned_at' => now(),
        ]);

        $this->actingAs($ops, 'sanctum')
            ->deleteJson("/api/delivery/managers/{$id}")->assertStatus(422);
        $this->assertNotNull(DeliveryManager::find($id));
    }

    public function test_plain_users_cannot_delete_managers(): void
    {
        $owner = $this->createUser();
        $id = $this->registerFor($owner);

        $this->actingAs($this->createUser(), 'sanctum')
            ->deleteJson("/api/delivery/managers/{$id}")->assertStatus(403);
        $this->assertNotNull(DeliveryManager::find($id));
    }

    public function test_ops_register_another_account_by_email(): void
    {
        $ops = $this->createUser();
        $this->assignRole($ops, 'transport_admin');
        $target = $this->createUser();

        $res = $this->actingAs($ops, 'sanctum')
            ->postJson('/api/delivery/managers', [
                'user_email' => $target->email,
                'full_name' => 'Console Rider',
                'phone' => '+233240000001',
                'vehicle_type' => 'van',
                'is_available' => false,
            ])->assertStatus(201);

        $manager = DeliveryManager::findOrFail($res->json('data.id'));
        $this->assertSame($target->id, $manager->user_id);
        $this->assertFalse($manager->is_available);
        $this->assertSame('van', $manager->vehicle_type);
    }

    public function test_register_by_email_rejects_unknown_address(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/delivery/managers', [
            'user_email' => 'ghost@example.com',
            'full_name' => 'Ghost',
            'phone' => '+233240000002',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'No account found with that email address');
    }

    public function test_register_by_email_rejects_duplicate_rider(): void
    {
        $this->actingAsAdmin();
        $target = $this->createUser();
        DeliveryManager::create([
            'user_id' => $target->id,
            'full_name' => 'Existing',
            'phone' => '+233240000003',
            'is_available' => true,
            'completed_deliveries' => 0,
            'rating' => 0,
        ]);

        $this->postJson('/api/delivery/managers', [
            'user_email' => $target->email,
            'full_name' => 'Duplicate',
            'phone' => '+233240000004',
        ])->assertStatus(422)
            ->assertJsonPath('message', 'This account already has a delivery manager profile');
    }

    public function test_plain_users_cannot_register_other_accounts(): void
    {
        $target = $this->createUser();

        $this->actingAs($this->createUser(), 'sanctum')
            ->postJson('/api/delivery/managers', [
                'user_email' => $target->email,
                'full_name' => 'Sneaky',
                'phone' => '+233240000005',
            ])->assertStatus(403);

        $this->assertNull(DeliveryManager::where('user_id', $target->id)->first());
    }
}
