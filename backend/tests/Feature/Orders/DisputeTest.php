<?php

namespace Tests\Feature\Orders;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Orders\Entities\Dispute;
use Modules\Orders\Entities\Order;
use Tests\TestCase;

class DisputeTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_dispute(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/disputes', [
            'subject' => 'Item not received',
            'description' => 'Package never arrived after 2 weeks',
        ]);

        $res->assertStatus(201)->assertJsonStructure(['data' => ['id', 'status']]);
        $this->assertDatabaseHas('disputes', ['user_id' => $user->id, 'status' => 'open']);
    }

    public function test_customer_can_create_dispute_with_order(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => 'EN-DISP01',
            'status' => 'delivered',
            'subtotal' => 100.00,
            'total_amount' => 100.00,
            'currency' => 'USD',
            'shipping_address' => '123',
        ]);
        $this->actingAs($user, 'sanctum');

        $res = $this->postJson('/api/disputes', [
            'order_id' => $order->id,
            'subject' => 'Wrong item',
            'description' => 'Received wrong product',
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('disputes', ['order_id' => $order->id]);
    }

    public function test_customer_can_list_disputes(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($user, 'sanctum');

        Dispute::create([
            'user_id' => $user->id,
            'subject' => 'Test dispute',
            'description' => 'Desc',
            'status' => 'open',
        ]);

        $res = $this->getJson('/api/disputes');

        $res->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_customer_can_close_own_dispute(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($user, 'sanctum');

        $dispute = Dispute::create([
            'user_id' => $user->id,
            'subject' => 'Close me',
            'description' => 'Desc',
            'status' => 'open',
        ]);

        $res = $this->postJson("/api/disputes/{$dispute->id}/close");

        $res->assertOk();
        $this->assertDatabaseHas('disputes', ['id' => $dispute->id, 'status' => 'closed']);
    }

    public function test_cannot_close_other_users_dispute(): void
    {
        $user1 = User::factory()->create(['email_verified_at' => now()]);
        $user2 = User::factory()->create(['email_verified_at' => now()]);

        $dispute = Dispute::create([
            'user_id' => $user1->id,
            'subject' => 'Not yours',
            'description' => 'Desc',
            'status' => 'open',
        ]);

        $this->actingAs($user2, 'sanctum');
        $res = $this->postJson("/api/disputes/{$dispute->id}/close");

        $res->assertStatus(404);
    }
}
