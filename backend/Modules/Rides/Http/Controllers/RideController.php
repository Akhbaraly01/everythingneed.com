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
        return response()->json(\Illuminate\Support\Facades\DB::transaction(function () use ($request, $rideId) {
            $driver = Driver::where('user_id', $request->user()->id)->first();

            if (!$driver) {
                abort(response()->json(['message' => 'Not a registered driver'], 403));
            }

            $ride = Ride::where('id', $rideId)->lockForUpdate()->first();

            if (!$ride) {
                throw new NotFoundException('Ride', $rideId);
            }

            if ((string) $ride->user_id === (string) $request->user()->id) {
                abort(response()->json(['message' => 'You cannot accept your own ride'], 403));
            }

            if ($ride->status !== 'requested') {
                abort(response()->json(['message' => 'Ride is no longer available'], 409));
            }

            $ride->update([
                'driver_id' => $driver->id,
                'status' => 'accepted',
            ]);

            $this->notify(
                (string) $ride->user_id,
                'Driver accepted your ride',
                'Your ride request was accepted. The driver is on the way.',
                $ride->id
            );

            return [
                'message' => 'Ride accepted successfully',
                'data' => $ride->fresh(),
            ];
        }));
    }

    /** Driver marks an accepted ride completed (fare is confirmed, not estimated). */
    public function completeRide(Request $request, string $rideId): JsonResponse
    {
        $driver = Driver::where('user_id', $request->user()->id)->first();

        if (!$driver) {
            return response()->json(['message' => 'Not a registered driver'], 403);
        }

        $ride = Ride::where('id', $rideId)->where('driver_id', $driver->id)->first();

        if (!$ride) {
            throw new NotFoundException('Ride', $rideId);
        }

        if (!in_array($ride->status, [Ride::STATUS_ACCEPTED, Ride::STATUS_IN_PROGRESS], true)) {
            return response()->json(['message' => "Ride cannot be completed from status '{$ride->status}'"], 422);
        }

        $validated = $request->validate([
            'fare' => ['nullable', 'numeric', 'min:0'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
        ]);

        $ride->update([
            'status' => Ride::STATUS_COMPLETED,
            'fare' => $validated['fare'] ?? $ride->fare,
            'distance_km' => $validated['distance_km'] ?? $ride->distance_km,
            'duration_minutes' => $validated['duration_minutes'] ?? $ride->duration_minutes,
            'completed_at' => now(),
        ]);
        $driver->increment('total_rides');

        $this->notify(
            (string) $ride->user_id,
            'Ride completed',
            'Your ride is complete. Thank you for riding with us.',
            $ride->id
        );

        return response()->json([
            'message' => 'Ride completed',
            'data' => $ride->fresh(),
        ]);
    }

    /** Rider (requested) or driver (accepted) cancels a ride. */
    public function cancelRide(Request $request, string $rideId): JsonResponse
    {
        $ride = Ride::where('id', $rideId)->first();

        if (!$ride) {
            throw new NotFoundException('Ride', $rideId);
        }

        $isRider = (string) $ride->user_id === (string) $request->user()->id;
        $isDriver = $ride->driver_id && Driver::where('id', $ride->driver_id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (!$isRider && !$isDriver) {
            return response()->json(['message' => 'You do not have access to this ride'], 403);
        }

        if (!in_array($ride->status, [Ride::STATUS_REQUESTED, Ride::STATUS_ACCEPTED], true)) {
            return response()->json(['message' => "Ride cannot be cancelled from status '{$ride->status}'"], 422);
        }

        $ride->update(['status' => Ride::STATUS_CANCELLED]);

        return response()->json([
            'message' => 'Ride cancelled',
            'data' => $ride->fresh(),
        ]);
    }

    /** Spec 50 transactional fan-out; best-effort, never breaks rides. */
    private function notify(string $userId, string $title, string $message, ?string $relatedId = null): void
    {
        try {
            app(\Core\Services\Contracts\NotificationServiceInterface::class)
                ->notify($userId, $title, $message, 'booking', $relatedId);
        } catch (\Throwable) {
        }
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

    /**
     * Nearby available drivers (compat endpoint). Fares are confirmed by the
     * driver on accept - this endpoint never invents a price.
     */
    public function available(Request $request): JsonResponse
    {
        $drivers = \Modules\Rides\Entities\Driver::where('is_available', true)
            ->limit(10)
            ->get()
            ->map(fn ($d) => [
                'id' => $d->id,
                'driver' => [
                    'full_name' => $d->full_name,
                    'rating' => $d->rating,
                    'vehicle_type' => $d->vehicle_type,
                ],
                'vehicle_type' => $d->vehicle_type,
                'fare_quote' => null,
                'fare_note' => 'Fare confirmed by the driver on accept',
            ]);

        return response()->json(['data' => $drivers]);
    }

    /**
     * Admin console: every ride platform-wide (myRides only shows your own).
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,requested,accepted,in_progress,completed,cancelled'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = \Modules\Rides\Entities\Ride::query()
            ->leftJoin('users as u', 'u.id', '=', 'rides.user_id')
            ->select([
                'rides.*',
                'u.name as rider_name', 'u.email as rider_email',
            ])
            ->orderByDesc('rides.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('rides.pickup_address', 'ilike', "%{$search}%")
                    ->orWhere('rides.dropoff_address', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('rides.status', $status);
        }

        $total = (clone $query)->count();
        $page = (int) ($validated['page'] ?? 1);
        $rows = $query->offset(($page - 1) * 25)->limit(25)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => 25, 'total' => $total],
        ]);
    }
}
