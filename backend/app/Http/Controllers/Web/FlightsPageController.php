<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Bookings\Entities\Booking;
use Modules\Rides\Entities\Flight;

class FlightsPageController extends Controller
{
    public function search(Request $request): Response
    {
        $query = Flight::where('is_active', true)
            ->where('seats_available', '>', 0);

        if ($origin = trim((string) $request->query('origin'))) {
            $query->where(function ($q) use ($origin) {
                $q->where('origin_code', 'ilike', "{$origin}%")
                    ->orWhere('origin_city', 'ilike', "%{$origin}%");
            });
        }

        if ($destination = trim((string) $request->query('destination'))) {
            $query->where(function ($q) use ($destination) {
                $q->where('destination_code', 'ilike', "{$destination}%")
                    ->orWhere('destination_city', 'ilike', "%{$destination}%");
            });
        }

        if ($date = $request->query('date')) {
            try {
                $dayOfWeek = (int) \Carbon\Carbon::parse($date)->dayOfWeek;
                $query->whereJsonContains('days_of_week', $dayOfWeek);
            } catch (\Exception) {
                // ignore invalid date; show all
            }
        }

        if ($maxPrice = $request->query('max_price')) {
            $query->where('price', '<=', (float) $maxPrice);
        }

        $flights = $query->orderBy('price')->paginate(15)->withQueryString();

        return Inertia::render('flights/Search', [
            'flights' => $flights,
            'filters' => $request->only(['origin', 'destination', 'date', 'max_price']),
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $flight = Flight::where('is_active', true)->findOrFail($id);

        return Inertia::render('flights/Show', [
            'flight' => $flight,
        ]);
    }

    public function confirmation(Request $request, string $bookingId): Response
    {
        $booking = Booking::with('user:id,name,email')
            ->where('service_type', 'flight')
            ->findOrFail($bookingId);

        abort_unless(
            $booking->user_id === $request->user()->id,
            403,
            'This booking belongs to another account.'
        );

        return Inertia::render('flights/Confirmation', [
            'booking' => $booking,
        ]);
    }

    public function myBookings(Request $request): Response
    {
        $bookings = Booking::with('user:id,name')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(12);

        return Inertia::render('flights/MyBookings', [
            'bookings' => $bookings,
        ]);
    }
}
