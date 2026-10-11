<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Hotels\Entities\HotelReservation;

/**
 * W11 hotels demo data: three reservations for the canonical customer
 * account across the stay lifecycle (confirmed, checked_in, cancelled)
 * so the hotel surfaces are never empty on a fresh install. Idempotent
 * (HTR-DEMO-* references).
 */
class HotelsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        if (!$customer) {
            return;
        }

        $this->seed('HTR-DEMO-1', $customer, 'standard', 'confirmed', now()->addDays(10), now()->addDays(12), 2);
        $this->seed('HTR-DEMO-2', $customer, 'deluxe', 'checked_in', now()->subDay(), now()->addDays(2), 2, now());
        $this->seed('HTR-DEMO-3', $customer, 'suite', 'cancelled', now()->addDays(20), now()->addDays(22), 4);
    }

    private function seed(
        string $reference,
        User $customer,
        string $roomType,
        string $status,
        \DateTimeInterface $checkIn,
        \DateTimeInterface $checkOut,
        int $guests,
        ?\DateTimeInterface $checkedInAt = null
    ): void {
        $room = \DB::table('hotel_rooms')
            ->where('room_type', $roomType)
            ->where('is_available', true)
            ->first();

        if (!$room) {
            return;
        }

        $nights = max(1, (int) round(($checkOut->getTimestamp() - $checkIn->getTimestamp()) / 86400));

        HotelReservation::firstOrCreate(
            ['reference' => $reference],
            [
                'user_id' => $customer->id,
                'hotel_id' => $room->hotel_id,
                'room_id' => $room->id,
                'check_in_date' => $checkIn->format('Y-m-d'),
                'check_out_date' => $checkOut->format('Y-m-d'),
                'guests' => $guests,
                'total_amount' => round((float) $room->price_per_night * $nights, 2),
                'currency' => $room->currency ?? 'USD',
                'status' => $status,
                'special_requests' => 'DEMO: quiet room if possible.',
                'checked_in_at' => $checkedInAt,
            ]
        );
    }
}
