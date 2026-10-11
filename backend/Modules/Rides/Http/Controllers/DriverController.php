<?php

namespace Modules\Rides\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Rides\Entities\Driver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /** Register the current user as a driver (one profile per user). */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'license_number' => 'required|string|max:50',
            'vehicle_type' => 'required|string|max:50',
        ]);

        if (Driver::where('user_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'You are already registered as a driver'], 409);
        }

        $driver = Driver::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'is_available' => true,
        ]));

        return response()->json([
            'message' => 'Driver registered successfully',
            'data' => $driver,
        ], 201);
    }

    /** Toggle the current driver's availability for new requests. */
    public function setAvailability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_available' => 'required|boolean',
        ]);

        $driver = Driver::where('user_id', $request->user()->id)->first();

        if (!$driver) {
            return response()->json(['message' => 'Not a registered driver'], 403);
        }

        $driver->update(['is_available' => $validated['is_available']]);

        return response()->json([
            'message' => 'Availability updated',
            'data' => $driver->fresh(),
        ]);
    }

    /** The current user's driver profile, if any. */
    public function me(Request $request): JsonResponse
    {
        $driver = Driver::where('user_id', $request->user()->id)->first();

        if (!$driver) {
            return response()->json(['message' => 'Not a registered driver'], 404);
        }

        return response()->json(['data' => $driver]);
    }
}
