<?php

namespace Tests\Feature\Hotels;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelReservation;
use Modules\Hotels\Entities\HotelRoom;
use Modules\Payments\Entities\Payment;
use Tests\TestCase;

/**
 * Spec 54/97: reservation -> payment -> confirmation, with refunds on
 * cancellation. Reserve creates a pending, unpaid booking; only a
 * successful payment confirms it (and therefore unlocks check-in).
 */
class HotelReservationPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function makeHotelWithRoom(): array
    {
        $hotel = Hotel::create([
            'name' => 'Pay Hotel',
            'address' => '1 Pay Ave',
            'city' => 'Accra',
            'country' => 'GH',
            'is_active' => true,
        ]);
        $room = HotelRoom::create([
            'hotel_id' => $hotel->id,
            'room_type' => 'standard',
            'price_per_night' => 150,
            'currency' => 'USD',
            'capacity' => 2,
            'is_available' => true,
        ]);

        return [$hotel, $room];
    }

    private function reserve($user, HotelRoom $room, int $fromDays = 10, int $toDays = 12): string
    {
        return $this->actingAs($user, 'sanctum')
            ->postJson("/api/hotels/{$room->hotel_id}/reserve", [
                'room_id' => $room->id,
                'check_in' => now()->addDays($fromDays)->toDateString(),
                'check_out' => now()->addDays($toDays)->toDateString(),
                'guests' => 2,
            ])
            ->assertStatus(201)
            ->json('data.id');
    }

    public function test_reserve_creates_pending_unpaid_reservation(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $row = HotelReservation::find($id);
        $this->assertSame('pending', $row->status);
        $this->assertSame('unpaid', $row->payment_status);
        $this->assertNull($row->payment_id);
    }

    public function test_payment_confirms_reservation_and_is_idempotent(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.payment_status', 'paid');

        $row = HotelReservation::find($id);
        $this->assertSame('confirmed', $row->status);
        $this->assertSame('paid', $row->payment_status);
        $this->assertNotNull($row->payment_id);
        $this->assertNotNull($row->paid_at);

        $paymentCount = Payment::where('user_id', $guest->id)->count();
        $this->assertSame(1, $paymentCount);

        // Second pay replays the idempotency key: no double charge.
        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $this->assertSame(1, Payment::where('user_id', $guest->id)->count());
    }

    public function test_stranger_cannot_pay_reservation(): void
    {
        $guest = $this->createUser();
        $stranger = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertStatus(403);

        $this->assertSame('unpaid', HotelReservation::find($id)->payment_status);
    }

    public function test_cancel_paid_reservation_refunds_in_full(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertOk();

        $paymentId = HotelReservation::find($id)->payment_id;

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.payment_status', 'refunded');

        $this->assertSame('cancelled', HotelReservation::find($id)->status);
        $this->assertSame('refunded', HotelReservation::find($id)->payment_status);
        $this->assertSame('refunded', Payment::find($paymentId)->status);
    }

    public function test_cannot_pay_cancelled_reservation(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/cancel")
            ->assertOk();

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", ['method' => 'card'])
            ->assertStatus(422);
    }

    public function test_pay_requires_a_payment_method(): void
    {
        $guest = $this->createUser();
        [$hotel, $room] = $this->makeHotelWithRoom();
        $id = $this->reserve($guest, $room);

        $this->actingAs($guest, 'sanctum')
            ->postJson("/api/hotels/reservations/{$id}/pay", [])
            ->assertStatus(422);
    }
}
