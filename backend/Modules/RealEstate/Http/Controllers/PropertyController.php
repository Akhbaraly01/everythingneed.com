<?php

namespace Modules\RealEstate\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\RealEstate\Entities\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Property::where('is_active', true);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $properties = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $properties->items(),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $property = Property::with(['user'])->find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        return response()->json(['data' => $property]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'listing_type' => 'nullable|string|in:sale,rent',
            'property_type' => 'required|string|in:apartment,house,condo,land,commercial',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'required|string|max:100',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'area_sqft' => 'nullable|numeric|min:0',
            'area' => 'nullable|numeric|min:0',
            'images' => 'nullable|array',
        ]);

        // Legacy `area` alias maps onto the real area_sqft column.
        if (!isset($validated['area_sqft']) && isset($validated['area'])) {
            $validated['area_sqft'] = $validated['area'];
        }
        unset($validated['area']);

        $property = Property::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'listing_type' => $validated['listing_type'] ?? 'sale',
        ]));

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'create',
                'entity_type' => 'property',
                'entity_id' => $property->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['title' => $property->title, 'price' => $property->price],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content creation.
        }

        return response()->json([
            'message' => 'Property listed successfully',
            'data' => $property,
        ], 201);
    }

    /** The current user's own listings. */
    public function myListings(Request $request): JsonResponse
    {
        $properties = Property::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->get('per_page', 15), ['*'], 'page', (int) $request->get('page', 1));

        return response()->json([
            'data' => $properties->items(),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    /**
     * Contact/inquiry about a property (aliased by two routes).
     */
    public function inquiry(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:30',
            'message' => 'required|string|max:2000',
            'viewing_date' => 'nullable|date',
        ]);

        $prop = \Modules\RealEstate\Entities\Property::find($id);
        if (!$prop) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        $inquiry = \Modules\RealEstate\Entities\ViewingRequest::create([
            'property_id' => $id,
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'message' => $validated['message'],
            'viewing_date' => $validated['viewing_date'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $inquiry], 201);
    }
}
