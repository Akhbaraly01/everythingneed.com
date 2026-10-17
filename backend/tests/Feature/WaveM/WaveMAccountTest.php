<?php

namespace Tests\Feature\WaveM;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Messaging\Entities\ChatConversation;
use Modules\Orders\Entities\Order;
use Tests\TestCase;

class WaveMAccountTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(User $user): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'order_number' => 'ORD-WAVEM-'.strtoupper(substr($user->id, 0, 8)),
            'status' => 'pending',
            'total_amount' => 25,
            'shipping_address' => '123 Test St',
        ]);
    }

    public function test_account_orders_canonical_carries_real_orders(): void
    {
        $user = $this->createUser();
        $this->makeOrder($user);

        $this->get('/account/orders')->assertRedirect(route('login'));

        $this->actingAs($user, 'web')->get('/account/orders')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('orders/Index')
                ->has('orders.data', 1));
    }

    public function test_account_canonical_pages_render(): void
    {
        $user = $this->createUser();
        $order = $this->makeOrder($user);

        $public = [
            "/account/orders/{$order->id}",
            '/account/bookings/anything',
            '/account/needs',
            '/account/needs/anything',
            '/account/wishlist',
            '/account/messages',
            '/account/wallet',
            '/account/wallet/transactions',
            '/account/kyc',
            '/account/payment-methods',
            '/account/financial-services',
            '/account/support',
            '/account/settings',
        ];

        // actingAs persists across requests in one test, so all guest checks
        // run before any authenticated call.
        foreach ($public as $path) {
            $this->get($path)->assertRedirect(route('login'));
        }

        foreach ($public as $path) {
            $this->actingAs($user, 'web')->get($path)->assertOk();
        }
    }

    public function test_consolidated_account_routes_redirect_to_canonical_pages(): void
    {
        $this->get('/account/security')->assertRedirect(route('login'));

        $user = $this->createUser();

        $this->actingAs($user, 'web')->get('/account/security')->assertRedirect('/settings');
        $this->actingAs($user, 'web')->get('/account/wallet/deposit')->assertRedirect('/account/wallet');
        $this->actingAs($user, 'web')->get('/account/wallet/withdraw')->assertRedirect('/account/wallet');
    }

    public function test_account_order_detail_is_owner_scoped(): void
    {
        $owner = $this->createUser();
        $stranger = $this->createUser();
        $order = $this->makeOrder($owner);

        $this->actingAs($owner, 'web')->get("/account/orders/{$order->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('orders/Show'));

        // Strangers get the locked 404 contract (redirect, no leak).
        $this->actingAs($stranger, 'web')->get("/account/orders/{$order->id}")
            ->assertRedirect();
    }

    public function test_account_messages_are_participant_scoped(): void
    {
        $alice = $this->createUser();
        $bob = $this->createUser();
        $stranger = $this->createUser();

        $conversation = ChatConversation::create([
            'customer_id' => $alice->id,
            'worker_id' => $bob->id,
        ]);

        $this->actingAs($alice, 'web')->get('/account/messages')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('messages/Index'));

        $this->actingAs($alice, 'web')->get("/account/messages/{$conversation->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('messages/Show'));

        $this->actingAs($stranger, 'web')->get("/account/messages/{$conversation->id}")
            ->assertRedirect();
    }

    public function test_saved_payment_methods_crud(): void
    {
        $user = $this->createUser();
        $other = $this->createUser();

        $this->getJson('/api/payment-methods')->assertStatus(401);

        $created = $this->actingAs($user, 'sanctum')->postJson('/api/payment-methods', [
            'type' => 'card',
            'last_four' => '4242',
            'brand' => 'Visa',
        ])->assertStatus(201);
        $methodId = $created->json('data.id');
        $this->assertNotEmpty($methodId);

        // Validation: bad type and bad last-four rejected.
        $this->actingAs($user, 'sanctum')->postJson('/api/payment-methods', [
            'type' => 'crypto',
            'last_four' => '4242',
        ])->assertStatus(422);
        $this->actingAs($user, 'sanctum')->postJson('/api/payment-methods', [
            'type' => 'card',
            'last_four' => '42',
        ])->assertStatus(422);

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/payment-methods')->assertOk();
        $this->assertSame(1, count($list->json('data')));

        // Another user's method id cannot be removed through this account.
        $this->actingAs($other, 'sanctum')->deleteJson("/api/payment-methods/{$methodId}")
            ->assertStatus(404);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/payment-methods/{$methodId}")
            ->assertOk();
        $this->actingAs($user, 'sanctum')->deleteJson("/api/payment-methods/{$methodId}")
            ->assertStatus(404);
    }
}
