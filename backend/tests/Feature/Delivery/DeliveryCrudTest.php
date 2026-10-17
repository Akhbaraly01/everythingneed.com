<?php

namespace Tests\Feature\Delivery;

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
}
