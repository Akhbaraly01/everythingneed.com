<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Hotels\Entities\Hotel;

class HotelsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Hotel::where('is_active', true);

        if ($city = trim((string) $request->query('city'))) {
            $query->where('city', 'ilike', "%{$city}%");
        }

        if ($minStars = (int) $request->query('min_stars', 0)) {
            $query->where('star_rating', '>=', $minStars);
        }

        $hotels = $query->with('rooms:id,hotel_id,room_type,price_per_night,capacity,is_available')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('hotels/Index', [
            'hotels' => $hotels,
            'filters' => $request->only(['city', 'min_stars']),
        ]);
    }

    public function show(string $id): Response
    {
        $hotel = Hotel::with('rooms')->where('is_active', true)->findOrFail($id);

        return Inertia::render('hotels/Show', [
            'hotel' => $hotel,
        ]);
    }

    public function booking(string $id): Response
    {
        $hotel = Hotel::with('rooms')->where('is_active', true)->findOrFail($id);

        return Inertia::render('hotels/Booking', [
            'hotel' => $hotel->only('id', 'name', 'city', 'star_rating', 'image_url'),
            'rooms' => $hotel->rooms->where('is_available', true),
        ]);
    }
}
