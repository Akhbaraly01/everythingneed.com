<?php

namespace Tests\Feature\Food;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Food\Entities\Restaurant;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console restaurant CRUD: full edit (PUT) + guarded delete (DELETE) on
 * /api/admin/restaurants/{id} for super_admin / administrator / food_admin.
 */
class AdminRestaurantCrudTest extends TestCase
{
    use RefreshDatabase;

    private function makeRestaurant(array $overrides = []): Restaurant
    {
        return Restaurant::create(array_merge([
            'name' => 'Crud Test Kitchen',
            'cuisine_type' => 'Ghanaian',
            'address' => '1 Test Ave',
            'city' => 'Accra',
            'is_active' => true,
        ], $overrides));
    }

    #[Test]
    public function test_super_admin_edits_every_field(): void
    {
        $this->actingAsAdmin();
        $restaurant = $this->makeRestaurant();

        $this->putJson("/api/admin/restaurants/{$restaurant->id}", [
            'name' => 'Renamed Bistro',
            'description' => 'Fresh description',
            'cuisine_type' => 'Fusion',
            'address' => '2 New Road',
            'city' => 'Kumasi',
            'phone' => '+233 20 000 0000',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Renamed Bistro')
            ->assertJsonPath('data.city', 'Kumasi')
            ->assertJsonPath('data.is_active', false);

        $fresh = Restaurant::findOrFail($restaurant->id);
        $this->assertSame('Fusion', $fresh->cuisine_type);
        $this->assertSame('+233 20 000 0000', $fresh->phone);
        $this->assertFalse($fresh->is_active);
    }

    #[Test]
    public function test_toggle_only_payload_still_works(): void
    {
        $this->actingAsAdmin();
        $restaurant = $this->makeRestaurant();

        $this->putJson("/api/admin/restaurants/{$restaurant->id}", ['is_active' => false])
            ->assertOk();

        $this->assertFalse(Restaurant::findOrFail($restaurant->id)->is_active);
    }

    #[Test]
    public function test_empty_payload_is_rejected(): void
    {
        $this->actingAsAdmin();
        $restaurant = $this->makeRestaurant();

        $this->putJson("/api/admin/restaurants/{$restaurant->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_edit_404s_for_unknown_restaurant(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/restaurants/' . Str::uuid(), ['name' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_food_admin_role_can_edit_and_delete(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'food_admin');
        $this->actingAs($actor, 'sanctum');

        $restaurant = $this->makeRestaurant();

        $this->putJson("/api/admin/restaurants/{$restaurant->id}", ['name' => 'Food Admin Rename'])
            ->assertOk();

        $this->deleteJson("/api/admin/restaurants/{$restaurant->id}")->assertOk();
        $this->assertNull(Restaurant::find($restaurant->id));
    }

    #[Test]
    public function test_plain_user_cannot_edit_or_delete(): void
    {
        $restaurant = $this->makeRestaurant();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/admin/restaurants/{$restaurant->id}", ['name' => 'Hacked'])->assertStatus(403);
        $this->deleteJson("/api/admin/restaurants/{$restaurant->id}")->assertStatus(403);
    }

    #[Test]
    public function test_delete_soft_deletes_the_restaurant(): void
    {
        $this->actingAsAdmin();
        $restaurant = $this->makeRestaurant();

        $this->deleteJson("/api/admin/restaurants/{$restaurant->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Restaurant deleted');

        $this->assertNull(Restaurant::find($restaurant->id));
        $trashed = Restaurant::withTrashed()->find($restaurant->id);
        $this->assertNotNull($trashed);
        $this->assertNotNull($trashed->deleted_at);

        // Public reads no longer resolve it.
        $this->getJson("/api/restaurants/{$restaurant->id}")->assertStatus(404);
    }

    #[Test]
    public function test_delete_is_refused_while_orders_exist(): void
    {
        $this->actingAsAdmin();
        $restaurant = $this->makeRestaurant();
        $customer = User::factory()->create();

        DB::table('food_orders')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'order_number' => 'FD-CRUD-1',
            'delivery_address' => '12 Test Street',
            'total_amount' => 25,
            'status' => 'pending',
            'delivery_fee' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->deleteJson("/api/admin/restaurants/{$restaurant->id}")
            ->assertStatus(422);

        $this->assertNotNull(Restaurant::find($restaurant->id));
    }
}
