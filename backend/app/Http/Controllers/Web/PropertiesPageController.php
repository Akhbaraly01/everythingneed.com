<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\RealEstate\Entities\Property;

class PropertiesPageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Property::where('is_active', true);

        if ($city = trim((string) $request->query('city'))) {
            $query->where('city', 'ilike', "%{$city}%");
        }

        if ($type = trim((string) $request->query('type'))) {
            $query->where('property_type', 'ilike', $type);
        }

        if ($minPrice = (float) $request->query('min_price', 0)) {
            $query->where('price', '>=', $minPrice);
        }

        if ($maxPrice = (float) $request->query('max_price', 0)) {
            $query->where('price', '<=', $maxPrice);
        }

        $properties = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('properties/Index', [
            'properties' => $properties,
            'filters' => $request->only(['city', 'type', 'min_price', 'max_price']),
        ]);
    }

    public function show(string $id): Response
    {
        $property = Property::where('is_active', true)->findOrFail($id);

        return Inertia::render('properties/Show', [
            'property' => $property,
        ]);
    }
}
