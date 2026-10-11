<?php

namespace Modules\Hotels\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Hotels\Entities\Hotel;
use Modules\Hotels\Entities\HotelReservation;
use Core\Exceptions\NotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Payments\Services\PaymentService;

class HotelController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
    }

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
                    'reference' => 'HTR-'.strtoupper(\Illuminate\Support\Str::random(6)),
                    'user_id' => $request->user()->id,
                    'hotel_id' => $hotelId,
                    'room_id' => $room->id,
                    'check_in_date' => $validated['check_in'],
                    'check_out_date' => $validated['check_out'],
                    'guests' => $validated['guests'],
                    'total_amount' => $total,
                    'currency' => $room->currency ?? \Core\Support\Currencies::default(),
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'special_requests' => $validated['special_requests'] ?? null,
                ]);
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Reservation created. Complete payment to confirm it.',
            'data' => $reservation,
        ], 201);
    }

    /**
     * Pay a pending reservation (spec 54/97: booking -> payment -> confirmation).
     * The amount is derived server-side from the reservation, never from input.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $reservation = HotelReservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        if ((string) $reservation->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this reservation'], 403);
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot pay for a '{$reservation->status}' reservation"], 422);
        }

        if ($reservation->payment_status === 'paid') {
            return response()->json([
                'message' => 'Reservation already paid',
                'data' => $reservation,
            ]);
        }

        $request->validate(['method' => 'required|string|max:30']);

        $payment = $this->payments->charge([
            'user_id' => (string) $request->user()->id,
            'amount' => (float) $reservation->total_amount,
            'currency' => $reservation->currency ?? \Core\Support\Currencies::default(),
            'method' => $request->input('method'),
            'idempotency_key' => 'htr-'.$reservation->id,
            'purpose' => 'hotel_reservation',
            'metadata' => [
                'reservation_id' => $reservation->id,
                'reference' => $reservation->reference,
            ],
        ]);

        if ($payment->status !== 'succeeded') {
            return response()->json([
                'message' => 'Payment is processing',
                'data' => ['payment_status' => 'processing', 'reservation' => $reservation],
            ], 202);
        }

        $reservation->update([
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'payment_id' => $payment->id,
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment succeeded. Reservation confirmed.',
            'data' => $reservation->fresh(),
        ]);
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

    /** One reservation (own records only). */
    public function showReservation(Request $request, string $id): JsonResponse
    {
        $reservation = HotelReservation::with(['hotel:id,name,city,image_url'])
            ->where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        return response()->json(['data' => $reservation]);
    }

    /**
     * §14 stay lifecycle: confirmed → checked_in → checked_out (→ completed).
     * Owner or staff; timestamps recorded for the folio.
     */
    public function checkIn(Request $request, string $id): JsonResponse
    {
        return $this->stayTransition($request, $id, 'confirmed', 'checked_in', 'checked_in_at');
    }

    public function checkOut(Request $request, string $id): JsonResponse
    {
        return $this->stayTransition($request, $id, 'checked_in', 'checked_out', 'checked_out_at');
    }

    private function stayTransition(Request $request, string $id, string $from, string $to, string $stampColumn): JsonResponse
    {
        $reservation = HotelReservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $user = $request->user();
        $isOwner = (string) $reservation->user_id === (string) $user->id;
        $isStaff = $user->hasRole('super_admin') || $user->hasRole('administrator');

        if (!$isOwner && !$isStaff) {
            return response()->json(['message' => 'You do not have access to this reservation'], 403);
        }

        if ($reservation->status !== $from) {
            return response()->json([
                'message' => "Cannot {$to} a reservation in status '{$reservation->status}'",
            ], 422);
        }

        $reservation->update([
            'status' => $to === 'checked_out' ? HotelReservation::STATUS_COMPLETED : $to,
            $stampColumn => now(),
        ]);

        return response()->json([
            'message' => ucfirst(str_replace('_', ' ', $to)).' successfully',
            'data' => $reservation->fresh(),
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

        // A paid reservation is refunded in full on cancellation (spec 54).
        if ($reservation->payment_status === 'paid' && $reservation->payment_id) {
            try {
                $this->payments->refund((string) $reservation->payment_id);
                $reservation->update(['payment_status' => 'refunded']);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Reservation cancelled successfully',
            'data' => $reservation->fresh(),
        ]);
    }

    /**
     * Single room within a hotel (public deep-link endpoint).
     */
    public function room(string $id, string $roomId): JsonResponse
    {
        $hotel = \Modules\Hotels\Entities\Hotel::find($id);
        if (!$hotel) {
            return response()->json(['message' => 'Hotel not found'], 404);
        }

        $room = \Modules\Hotels\Entities\HotelRoom::where('hotel_id', $id)->find($roomId);
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }

        return response()->json(['data' => ['hotel' => $hotel, 'room' => $room]]);
    }

    /**
     * Admin console: every hotel including inactive (public index hides them).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Hotel::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($q) => $q->where('name', 'ilike', "%{$search}%")->orWhere('city', 'ilike', "%{$search}%"));
        }
        if (in_array($request->get('status', 'all'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->get('status') === 'active');
        }

        $hotels = $query->paginate($request->get('per_page', 25));

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

    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $request->validate(['is_active' => 'required|boolean']);

        $hotel = Hotel::find($id);
        if (!$hotel) {
            return response()->json(['message' => 'Hotel not found'], 404);
        }
        $hotel->update(['is_active' => $request->boolean('is_active')]);

        return response()->json(['data' => $hotel]);
    }

    /**
     * Admin console: create a hotel (spec 47 — live in the public listing,
     * detail page, search and navigation immediately).
     *
     * POST /api/admin/hotels (role: super_admin, administrator, hotel_admin)
     */
    public function adminStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'star_rating' => 'nullable|integer|min:1|max:5',
            'image_url' => 'nullable|url|max:500',
            'amenities' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $hotel = Hotel::create(array_merge($data, [
            'is_active' => $data['is_active'] ?? true,
        ]));

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'create',
                'entity_type' => 'hotel',
                'entity_id' => $hotel->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['name' => $hotel->name, 'city' => $hotel->city],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content creation.
        }

        return response()->json([
            'message' => 'Hotel created successfully',
            'data' => $hotel,
        ], 201);
    }
}
