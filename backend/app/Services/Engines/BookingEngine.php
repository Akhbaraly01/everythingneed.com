<?php

namespace App\Services\Engines;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingEngine
{
    public function book(string $userId, string $serviceType, ?string $serviceId, array $details): object
    {
        return DB::transaction(function () use ($userId, $serviceType, $serviceId, $details) {
            return \Modules\Bookings\Entities\Booking::create([
                'user_id' => $userId,
                'service_type' => $serviceType,
                'service_id' => $serviceId,
                'details' => $details,
                'status' => 'pending',
            ]);
        });
    }

    public function transition(object $booking, string $newStatus, ?string $actorId = null): void
    {
        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['in_progress', 'cancelled'],
            'in_progress' => ['completed', 'cancelled'],
        ];
        if (!in_array($newStatus, $allowed[$booking->status] ?? [], true)) {
            abort(422, "Cannot transition from {$booking->status} to {$newStatus}");
        }
        $booking->update(['status' => $newStatus]);
        \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $actorId,
            'action' => 'booking_transition',
            'entity_type' => 'booking',
            'entity_id' => $booking->id,
            'new_values' => json_encode(['status' => $newStatus]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
