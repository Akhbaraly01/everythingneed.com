<?php

namespace Modules\Rides\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Bookings\Entities\Booking;
use Modules\Rides\Entities\Flight;

class FlightController extends Controller
{
    /**
     * Search inventory: origin/destination codes or cities + optional date.
     */
    public function search(Request $request): JsonResponse
    {
        $query = Flight::where('is_active', true)
            ->where('seats_available', '>', 0);

        if ($request->filled('origin')) {
            $origin = $request->origin;
            $query->where(function ($q) use ($origin) {
                $q->where('origin_code', 'ilike', "{$origin}%")
                    ->orWhere('origin_city', 'ilike', "%{$origin}%");
            });
        }

        if ($request->filled('destination')) {
            $destination = $request->destination;
            $query->where(function ($q) use ($destination) {
                $q->where('destination_code', 'ilike', "{$destination}%")
                    ->orWhere('destination_city', 'ilike', "%{$destination}%");
            });
        }

        if ($request->filled('date')) {
            try {
                $dayOfWeek = (int) \Carbon\Carbon::parse($request->date)->dayOfWeek;
                // JSON array containment: match flights operating that weekday
                $query->whereJsonContains('days_of_week', $dayOfWeek);
            } catch (\Exception) {
                return response()->json(['message' => 'Invalid date format'], 422);
            }
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        $flights = $query->orderBy('price')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $flights->items(),
            'meta' => [
                'current_page' => $flights->currentPage(),
                'last_page' => $flights->lastPage(),
                'per_page' => $flights->perPage(),
                'total' => $flights->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $flight = Flight::where('is_active', true)->find($id);

        if (!$flight) {
            return response()->json(['message' => 'Flight not found'], 404);
        }

        return response()->json(['data' => $flight]);
    }

    /**
     * Book seats: creates a booking record with passenger details and
     * a booking reference. Seats are decremented transactionally.
     */
    public function book(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'travel_date' => 'required|date|after:today',
            'passengers' => 'required|array|min:1|max:6',
            'passengers.*.name' => 'required|string|max:255',
            'passengers.*.passport' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email',
        ]);

        try {
            $booking = DB::transaction(function () use ($id, $validated, $request) {
                /** @var Flight|null $flight */
                $flight = Flight::where('id', $id)->lockForUpdate()->first();

                if (!$flight || !$flight->is_active) {
                    throw new \Core\Exceptions\ValidationException('Flight not available');
                }

                $seats = count($validated['passengers']);
                if ($flight->seats_available < $seats) {
                    throw new \Core\Exceptions\ValidationException("Only {$flight->seats_available} seat(s) left on this flight");
                }

                $flight->decrement('seats_available', $seats);

                $total = round((float) $flight->price * $seats, 2);
                $reference = 'FLB-'.strtoupper(uniqid());

                return Booking::create([
                    'user_id' => $request->user()->id,
                    'service_type' => 'flight',
                    'service_id' => $flight->id,
                    'details' => [
                        'reference' => $reference,
                        'flight_number' => $flight->flight_number,
                        'airline' => $flight->airline,
                        'route' => "{$flight->origin_city} ({$flight->origin_code}) → {$flight->destination_city} ({$flight->destination_code})",
                        'departure_time' => $flight->departure_time?->format('H:i'),
                        'arrival_time' => $flight->arrival_time?->format('H:i'),
                        'duration_minutes' => $flight->duration_minutes,
                        'travel_date' => $validated['travel_date'],
                        'passengers' => $validated['passengers'],
                        'contact_email' => $validated['contact_email'] ?? null,
                        'total_price' => $total,
                        'seat_count' => $seats,
                    ],
                    'status' => 'confirmed',
                ]);
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Flight booked successfully',
            'data' => [
                'booking_id' => $booking->id,
                'reference' => $booking->details['reference'],
                'status' => $booking->status,
            ],
        ], 201);
    }

    /**
     * Admin console: every flight including inactive/sold-out (public hides them).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Flight::query()->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(fn ($q) => $q->where('flight_number', 'ilike', "%{$search}%")->orWhere('airline', 'ilike', "%{$search}%"));
        }
        if (in_array($request->get('status', 'all'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->get('status') === 'active');
        }

        $flights = $query->paginate($request->get('per_page', 25));

        return response()->json([
            'data' => $flights->items(),
            'meta' => [
                'current_page' => $flights->currentPage(),
                'last_page' => $flights->lastPage(),
                'per_page' => $flights->perPage(),
                'total' => $flights->total(),
            ],
        ]);
    }

    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $request->validate(['is_active' => 'required|boolean']);

        $flight = Flight::find($id);
        if (!$flight) {
            return response()->json(['message' => 'Flight not found'], 404);
        }
        $flight->update(['is_active' => $request->boolean('is_active')]);

        return response()->json(['data' => $flight]);
    }
}
