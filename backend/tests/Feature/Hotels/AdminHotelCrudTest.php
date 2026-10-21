<?php

namespace Tests\Feature\Hotels;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Hotels\Entities\Hotel;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console hotel CRUD: full edit (PUT) + guarded delete (DELETE) on
 * /api/admin/hotels/{id} for super_admin / administrator / hotel_admin.
 * The console API is permission-gated (hotels.overview.*), so the seeded
 * role matrix has to be in place.
 */
class AdminHotelCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\PermissionSeeder::class);
        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');
    }

    private function makeHotel(array $overrides = []): Hotel
    {
        return Hotel::create(array_merge([
            'name' => 'Crud Test Hotel',
            'address' => '1 Test Ave',
            'city' => 'Accra',
            'country' => 'Ghana',
            'star_rating' => 4,
            'is_active' => true,
        ], $overrides));
    }

    #[Test]
    public function test_super_admin_edits_every_field(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();

        $this->putJson("/api/admin/hotels/{$hotel->id}", [
            'name' => 'Renamed Grand',
            'description' => 'Fresh description',
            'address' => '2 New Road',
            'city' => 'Kumasi',
            'country' => 'Ghana',
            'state' => 'Ashanti',
            'phone' => '+233 20 000 0000',
            'email' => 'stay@renamed.test',
            'star_rating' => 5,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Renamed Grand')
            ->assertJsonPath('data.city', 'Kumasi')
            ->assertJsonPath('data.is_active', false);

        $fresh = Hotel::findOrFail($hotel->id);
        $this->assertSame('Kumasi', $fresh->city);
        $this->assertSame(5, $fresh->star_rating);
        $this->assertSame('stay@renamed.test', $fresh->email);
        $this->assertFalse($fresh->is_active);
    }

    #[Test]
    public function test_toggle_only_payload_still_works(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();

        $this->putJson("/api/admin/hotels/{$hotel->id}", ['is_active' => false])
            ->assertOk();

        $this->assertFalse(Hotel::findOrFail($hotel->id)->is_active);
    }

    #[Test]
    public function test_empty_payload_is_rejected(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();

        $this->putJson("/api/admin/hotels/{$hotel->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_invalid_fields_are_validated(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();

        $this->putJson("/api/admin/hotels/{$hotel->id}", ['star_rating' => 9])
            ->assertStatus(422);
        $this->putJson("/api/admin/hotels/{$hotel->id}", ['email' => 'not-an-email'])
            ->assertStatus(422);
    }

    #[Test]
    public function test_edit_404s_for_unknown_hotel(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/hotels/' . Str::uuid(), ['name' => 'Ghost'])
            ->assertStatus(404);
    }

    #[Test]
    public function test_hotel_admin_role_can_edit_and_delete(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'hotel_admin');
        $this->actingAs($actor, 'sanctum');

        $hotel = $this->makeHotel();

        $this->putJson("/api/admin/hotels/{$hotel->id}", ['name' => 'Hotel Admin Rename'])
            ->assertOk();

        $this->deleteJson("/api/admin/hotels/{$hotel->id}")->assertOk();
        $this->assertNull(Hotel::find($hotel->id));
    }

    #[Test]
    public function test_plain_user_cannot_edit_or_delete(): void
    {
        $hotel = $this->makeHotel();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/admin/hotels/{$hotel->id}", ['name' => 'Hacked'])->assertStatus(403);
        $this->deleteJson("/api/admin/hotels/{$hotel->id}")->assertStatus(403);
    }

    #[Test]
    public function test_delete_soft_deletes_the_hotel(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();

        $this->deleteJson("/api/admin/hotels/{$hotel->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Hotel deleted');

        // Soft delete: hidden everywhere scoped, row retained for history.
        $this->assertNull(Hotel::find($hotel->id));
        $trashed = Hotel::withTrashed()->find($hotel->id);
        $this->assertNotNull($trashed);
        $this->assertNotNull($trashed->deleted_at);

        // Public reads no longer resolve it.
        $this->getJson("/api/hotels/{$hotel->id}")->assertStatus(404);
    }

    #[Test]
    public function test_delete_is_refused_while_reservations_exist(): void
    {
        $this->actingAsAdmin();
        $hotel = $this->makeHotel();
        $guest = User::factory()->create();

        $roomId = (string) Str::uuid();
        DB::table('hotel_rooms')->insert([
            'id' => $roomId,
            'hotel_id' => $hotel->id,
            'room_type' => 'standard',
            'price_per_night' => 80,
            'currency' => 'USD',
            'capacity' => 2,
            'is_available' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('hotel_reservations')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $guest->id,
            'hotel_id' => $hotel->id,
            'room_id' => $roomId,
            'check_in_date' => now()->addDays(2)->toDateString(),
            'check_out_date' => now()->addDays(4)->toDateString(),
            'guests' => 2,
            'total_amount' => 160,
            'currency' => 'USD',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->deleteJson("/api/admin/hotels/{$hotel->id}")
            ->assertStatus(422);

        $this->assertNotNull(Hotel::find($hotel->id));
    }
}
