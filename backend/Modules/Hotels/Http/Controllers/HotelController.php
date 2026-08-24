<?php

namespace Modules\Hotels\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelReservation;
use Core\Exceptions\NotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Hotel::where('is_active', true);

        if ($request->has('city')) {
            $query->where('city', 'ilike', "%{$request->city}%");
        }

        if ($request->has('min_stars')) {
            $query->where('star_rating', '>=', $request->min_stars);
        }

        $hotels = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $hotels->items(),
            'meta' => [
                'current_page' => $hotels->currentPage(),
                'last_page' => $hotels->lastPage(),
                'per_page' => $hotels->perPage(),
                'total' => $hotels->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $hotel = Hotel::with(['rooms'])->find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hotel not found'], 404);
        }

        return response()->json(['data' => $hotel]);
    }

    public function rooms(Request $request, string $id): JsonResponse
    {
        $hotel = Hotel::find($id);

        if (!$hotel) {
            return response()->json(['message' => 'Hotel not found'], 404);
        }

        $rooms = \Modules\Hotels\Entities\HotelRoom::where('hotel_id', $id)
            ->where('is_available', true)
            ->when($request->filled('room_type'), fn ($q) => $q->where('room_type', $request->room_type))
            ->orderBy('price_per_night')
            ->get();

        return response()->json(['data' => $rooms]);
    }

    public function reserve(Request $request, string $hotelId): JsonResponse
    {
        $hotel = Hotel::find($hotelId);

        if (!$hotel) {
            throw new NotFoundException('Hotel', $hotelId);
        }

        $validated = $request->validate([
            'room_id' => 'required|uuid|exists:hotel_rooms,id',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'required|integer|min:1',
            'special_requests' => 'nullable|string|max:1000',
        ]);

        try {
            $reservation = \Illuminate\Support\Facades\DB::transaction(function () use ($hotelId, $validated, $request) {
                /** @var \Modules\Hotels\Entities\HotelRoom|null $room */
                $room = \Modules\Hotels\Entities\HotelRoom::where('id', $validated['room_id'])
                    ->where('hotel_id', $hotelId)
                    ->where('is_available', true)
                    ->lockForUpdate()
                    ->first();

                if (!$room) {
                    throw new \Core\Exceptions\ValidationException('The selected room is not available at this hotel');
                }

                $maxGuests = (int) ($room->capacity ?? 0);
                if ($maxGuests > 0 && $validated['guests'] > $maxGuests) {
                    throw new \Core\Exceptions\ValidationException("This room accommodates up to {$maxGuests} guests");
                }

                // Overlap check against active reservations on this room
                $overlap = HotelReservation::where('room_id', $room->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('check_in_date', '<', $validated['check_out'])
                    ->where('check_out_date', '>', $validated['check_in'])
                    ->lockForUpdate()
                    ->exists();

                if ($overlap) {
                    throw new \Core\Exceptions\ValidationException('This room is already booked for those dates');
                }

                $nights = (int) round((strtotime($validated['check_out']) - strtotime($validated['check_in'])) / 86400);
                $total = round(((float) $room->price_per_night) * max(1, $nights), 2);

                return HotelReservation::create([
                    'user_id' => $request->user()->id,
                    'hotel_id' => $hotelId,
                    'room_id' => $room->id,
                    'check_in_date' => $validated['check_in'],
                    'check_out_date' => $validated['check_out'],
                    'guests' => $validated['guests'],
                    'total_amount' => $total,
                    'currency' => $room->currency ?? 'USD',
                    'status' => 'confirmed',
                    'special_requests' => $validated['special_requests'] ?? null,
                ]);
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Reservation confirmed',
            'data' => $reservation,
        ], 201);
    }

    /**
     * The authenticated guest's reservations, newest first.
     */
    public function myReservations(Request $request): JsonResponse
    {
        $reservations = HotelReservation::with(['hotel:id,name,city,image_url'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $reservations->items(),
            'meta' => [
                'current_page' => $reservations->currentPage(),
                'last_page' => $reservations->lastPage(),
                'per_page' => $reservations->perPage(),
                'total' => $reservations->total(),
            ],
        ]);
    }

    public function cancelReservation(Request $request, string $id): JsonResponse
    {
        $reservation = HotelReservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        if ((string) $reservation->user_id !== (string) $request->user()->id
            && !$request->user()->hasRole('super_admin')
            && !$request->user()->hasRole('administrator')) {
            return response()->json(['message' => 'You do not have access to this reservation'], 403);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot cancel a '{$reservation->status}' reservation"], 422);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Reservation cancelled successfully',
            'data' => $reservation->fresh(),
        ]);
    }
}
