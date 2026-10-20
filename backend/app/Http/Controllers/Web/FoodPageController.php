<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Food\Entities\Restaurant;

class FoodPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Restaurant::where('is_active', true);

        if ($city = trim((string) $request->query('city'))) {
            $query->where('city', 'ilike', "%{$city}%");
        }

        if ($cuisine = trim((string) $request->query('cuisine'))) {
            $query->where('cuisine_type', 'ilike', "%{$cuisine}%");
        }

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($inner) use ($q) {
                $inner->where('name', 'ilike', "%{$q}%")
                    ->orWhere('city', 'ilike', "%{$q}%");
            });
        }

        $restaurants = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('food/Index', [
            'restaurants' => $restaurants,
            'filters' => $request->only(['city', 'cuisine', 'q']),
        ]);
    }

    public function show(string $id): Response
    {
        $restaurant = Restaurant::with('menuItems')
            ->where('is_active', true)
            ->findOrFail($id);

        return Inertia::render('food/Show', [
            'restaurant' => $restaurant,
        ]);
    }
}
