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
            'user_id' => $this->resolveOwnerId($request),
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

    /**
     * Owner (lister) of a new listing.
     *
     * A self-service listing (POST /api/properties) belongs to the
     * authenticated user. A console listing (POST /api/admin/properties)
     * is a platform listing: it is attributed to the vendor account the
     * acting admin owns (the vendor's own user) and stays unowned when
     * the admin has no vendor record. An admin must never become the
     * customer-facing owner (and viewer-request handler) of a listing.
     */
    private function resolveOwnerId(Request $request): ?string
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        if (! $request->is('api/admin/properties')) {
            return $user->id;
        }

        return $user->vendor?->user_id;
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
            // N-43 tour slots: date must be today-or-later when given; the
            // time slot is optional so loose inquiries keep working.
            'viewing_date' => 'nullable|date|after_or_equal:today',
            'viewing_time' => 'nullable|date_format:H:i',
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
            'viewing_time' => $validated['viewing_time'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $inquiry], 201);
    }

    /**
     * N-43: property owner lists viewing requests for one listing.
     */
    public function viewingRequests(Request $request, string $id): JsonResponse
    {
        $prop = \Modules\RealEstate\Entities\Property::find($id);
        if (!$prop) {
            return response()->json(['message' => 'Property not found'], 404);
        }
        if ((string) $prop->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the listing owner can manage viewing requests'], 403);
        }

        $rows = \Modules\RealEstate\Entities\ViewingRequest::with('user:id,name,email')
            ->where('property_id', $id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $rows->items(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    /**
     * N-43: owner approves a pending request. Slot conflicts (same
     * property, date, and time already approved) are rejected — one tour
     * per slot.
     */
    public function approveViewing(Request $request, string $viewingId): JsonResponse
    {
        $viewing = \Modules\RealEstate\Entities\ViewingRequest::find($viewingId);
        if (!$viewing) {
            return response()->json(['message' => 'Viewing request not found'], 404);
        }

        $prop = \Modules\RealEstate\Entities\Property::find($viewing->property_id);
        if ((string) $prop?->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the listing owner can manage viewing requests'], 403);
        }

        if ($viewing->status !== \Modules\RealEstate\Entities\ViewingRequest::STATUS_PENDING) {
            return response()->json(['message' => "Cannot approve a {$viewing->status} request"], 422);
        }

        if ($viewing->viewing_date && $viewing->viewing_time) {
            $conflict = \Modules\RealEstate\Entities\ViewingRequest::where('property_id', $viewing->property_id)
                ->where('id', '!=', $viewing->id)
                ->where('status', \Modules\RealEstate\Entities\ViewingRequest::STATUS_APPROVED)
                ->whereDate('viewing_date', $viewing->viewing_date->toDateString())
                ->where('viewing_time', $viewing->viewing_time)
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'That date and time slot already has an approved viewing'], 409);
            }
        }

        $viewing->update(['status' => \Modules\RealEstate\Entities\ViewingRequest::STATUS_APPROVED]);

        return response()->json(['message' => 'Viewing approved', 'data' => $viewing->fresh()]);
    }

    /**
     * N-43: owner rejects a pending request.
     */
    public function rejectViewing(Request $request, string $viewingId): JsonResponse
    {
        $viewing = \Modules\RealEstate\Entities\ViewingRequest::find($viewingId);
        if (!$viewing) {
            return response()->json(['message' => 'Viewing request not found'], 404);
        }

        $prop = \Modules\RealEstate\Entities\Property::find($viewing->property_id);
        if ((string) $prop?->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the listing owner can manage viewing requests'], 403);
        }

        if ($viewing->status !== \Modules\RealEstate\Entities\ViewingRequest::STATUS_PENDING) {
            return response()->json(['message' => "Cannot reject a {$viewing->status} request"], 422);
        }

        $viewing->update(['status' => \Modules\RealEstate\Entities\ViewingRequest::STATUS_REJECTED]);

        return response()->json(['message' => 'Viewing rejected', 'data' => $viewing->fresh()]);
    }

    /**
     * N-43: requester sees their own viewing-request statuses.
     */
    public function myViewings(Request $request): JsonResponse
    {
        $rows = \Modules\RealEstate\Entities\ViewingRequest::with('property:id,title,address,city')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $rows->items(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }
}
