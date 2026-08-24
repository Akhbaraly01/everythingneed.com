<?php

namespace Modules\Rides\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Rides\Entities\Ride;
use Modules\Rides\Entities\Driver;
use Core\Exceptions\NotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RideController extends Controller
{
    public function requestRide(Request $request): JsonResponse
    {
        $ride = Ride::create(array_merge($request->validate([
            'pickup_address' => 'required|string|max:500',
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'dropoff_address' => 'required|string|max:500',
            'dropoff_lat' => 'required|numeric',
            'dropoff_lng' => 'required|numeric',
            'ride_type' => 'required|string|in:economy,comfort,premium',
        ]), [
            'user_id' => $request->user()->id,
            'status' => 'requested',
        ]));

        return response()->json([
            'message' => 'Ride requested successfully',
            'data' => $ride,
        ], 201);
    }

    public function acceptRide(Request $request, string $rideId): JsonResponse
    {
        $driver = Driver::where('user_id', $request->user()->id)->first();

        if (!$driver) {
            return response()->json(['message' => 'Not a registered driver'], 403);
        }

        $ride = Ride::find($rideId);

        if (!$ride) {
            throw new NotFoundException('Ride', $rideId);
        }

        $ride->update([
            'driver_id' => $driver->id,
            'status' => 'accepted',
        ]);

        return response()->json([
            'message' => 'Ride accepted successfully',
            'data' => $ride->fresh(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $ride = Ride::with(['driver', 'user'])->find($id);

        if (!$ride) {
            throw new NotFoundException('Ride', $id);
        }

        $isOwner = $ride->user_id === $request->user()->id;
        $isDriver = $ride->driver && Driver::where('id', $ride->driver_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$isOwner && !$isDriver) {
            return response()->json(['message' => 'You do not have access to this ride'], 403);
        }

        return response()->json(['data' => $ride]);
    }

    public function myRides(Request $request): JsonResponse
    {
        $rides = Ride::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $rides->items(),
            'meta' => [
                'current_page' => $rides->currentPage(),
                'last_page' => $rides->lastPage(),
                'per_page' => $rides->perPage(),
                'total' => $rides->total(),
            ],
        ]);
    }
}
