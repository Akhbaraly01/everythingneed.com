<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Checkout\Entities\Cart;
use Modules\Inventory\Entities\InventoryReservation;
use Modules\Products\Entities\Product;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    private string $vendorId = '';

    protected function setUp(): void
    {
        parent::setUp();

        $vendorUser = User::factory()->create();
        $this->vendorId = (string) Str::uuid();

        DB::table('vendors')->insert([
            'id' => $this->vendorId,
            'user_id' => $vendorUser->id,
            'store_name' => 'Reservation Test Vendor',
            'category' => 'general',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function makeProduct(int $stock): Product
    {
        return Product::factory()->create([
            'vendor_id' => $this->vendorId,
            'price' => 25.00,
            'stock_quantity' => $stock,
        ]);
    }

    private function addToCart(User $user, Product $product, int $qty)
    {
        return $this->actingAs($user, 'sanctum')->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => $qty,
        ]);
    }

    public function test_cart_add_creates_a_reservation_matching_cart_quantity(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(5);

        $this->addToCart($user, $product, 3)->assertOk();

        $reservation = InventoryReservation::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->first();

        $this->assertNotNull($reservation, 'add-to-cart must place a hold');
        $this->assertEquals(3, $reservation->quantity);
        $this->assertTrue($reservation->expires_at->isFuture());
    }

    public function test_last_unit_reserved_by_one_cart_blocks_another_buyer(): void
    {
        $buyerA = User::factory()->create();
        $buyerB = User::factory()->create();
        $product = $this->makeProduct(1);

        // A holds the only unit in their cart.
        $this->addToCart($buyerA, $product, 1)->assertOk();

        // B must not be able to claim it.
        $this->addToCart($buyerB, $product, 1)
            ->assertStatus(422)
            ->assertJson(['message' => 'Item is out of stock']);

        // A can still adjust their own hold (their reservation doesn't block them).
        $cart = Cart::where('user_id', $buyerA->id)->with('items')->first();
        $itemId = $cart->items->first()->id;
        $this->actingAs($buyerA, 'sanctum')
            ->putJson("/api/cart/items/{$itemId}", ['quantity' => 1])
            ->assertOk();
    }

    public function test_removing_the_item_releases_the_reservation(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(2);

        $this->addToCart($user, $product, 2)->assertOk();
        $this->assertEquals(1, InventoryReservation::count());

        $cart = Cart::where('user_id', $user->id)->with('items')->first();
        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/cart/items/' . $cart->items->first()->id)
            ->assertOk();

        $this->assertEquals(0, InventoryReservation::count(), 'removal must release the hold');
    }

    public function test_clearing_cart_releases_all_reservations(): void
    {
        $user = User::factory()->create();
        $productA = $this->makeProduct(5);
        $productB = $this->makeProduct(5);

        $this->addToCart($user, $productA, 1)->assertOk();
        $this->addToCart($user, $productB, 1)->assertOk();
        $this->assertEquals(2, InventoryReservation::count());

        $this->actingAs($user, 'sanctum')->deleteJson('/api/cart')->assertOk();

        $this->assertEquals(0, InventoryReservation::count());
    }

    public function test_expired_reservation_stops_blocking_and_is_purged_by_command(): void
    {
        $staleHolder = User::factory()->create();
        $buyer = User::factory()->create();
        $product = $this->makeProduct(1);

        // Simulate a hold whose window lapsed (never pruned yet).
        InventoryReservation::create([
            'user_id' => $staleHolder->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'expires_at' => now()->subMinute(),
        ]);

        // Expired holds don't consume availability.
        $this->addToCart($buyer, $product, 1)->assertOk();

        // Scheduler-style command purges lapsed rows (expired + this buyer's active stays).
        $this->artisan('inventory:release-expired')->assertExitCode(0);

        $this->assertEquals(1, InventoryReservation::where('user_id', $buyer->id)->count());
        $this->assertEquals(0, InventoryReservation::where('user_id', $staleHolder->id)->count());
    }

    public function test_placing_order_consumes_the_buyers_reservations(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(10);

        $this->addToCart($user, $product, 2)->assertOk();
        $this->assertEquals(1, InventoryReservation::count());

        $this->actingAs($user, 'sanctum')->postJson('/api/product-orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'shipping_address' => '1 Test Street',
        ])->assertStatus(201);

        $this->assertEquals(
            0,
            InventoryReservation::where('user_id', $user->id)->count(),
            'placing the order must release the buyer holds for ordered products'
        );
    }

    public function test_cart_show_exposes_availability_after_foreign_holds(): void
    {
        $buyerA = User::factory()->create();
        $buyerB = User::factory()->create();
        $product = $this->makeProduct(5);

        $this->addToCart($buyerA, $product, 2)->assertOk();
        $this->addToCart($buyerB, $product, 1)->assertOk();

        $res = $this->actingAs($buyerA, 'sanctum')->getJson('/api/cart');
        $res->assertOk();

        $availability = $res->json('data.availability');
        $this->assertArrayHasKey($product->id, $availability);
        $this->assertEquals(4, $availability[$product->id], '5 stock minus 1 held by the other cart');
    }
}
