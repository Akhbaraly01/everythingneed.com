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
        $property = Property::create(array_merge($request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'type' => 'required|string|in:sale,rent',
            'property_type' => 'required|string|in:apartment,house,land,commercial',
            'price' => 'required|numeric|min:0',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'area' => 'nullable|numeric|min:0',
        ]), ['owner_id' => $request->user()->id]));

        return response()->json([
            'message' => 'Property listed successfully',
            'data' => $property,
        ], 201);
    }
}
