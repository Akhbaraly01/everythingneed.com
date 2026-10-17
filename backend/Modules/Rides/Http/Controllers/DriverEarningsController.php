<?php

namespace Modules\Rides\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Rides\Entities\Driver;
use Modules\Rides\Entities\Ride;

/**
 * N-39 driver earnings view: aggregates confirmed fares on completed
 * rides the driver drove. Analytics only — riders are not yet charged
 * through the platform (payment flow is P4), so no wallet credit is
 * issued here; this is the view the payout flow will build on.
 */
class DriverEarningsController extends Controller
{
    private function driverOrFail(Request $request): Driver
    {
        $driver = Driver::where('user_id', $request->user()->id)->first();

        if (! $driver) {
            abort(response()->json(['message' => 'Driver profile required'], 403));
        }

        return $driver;
    }

    /** Completed rides driven by this driver, fare on record. */
    private function completedFor(Driver $driver)
    {
        return Ride::where('driver_id', $driver->id)
            ->where('status', 'completed')
            ->whereNotNull('fare');
    }

    public function earnings(Request $request): JsonResponse
    {
        $driver = $this->driverOrFail($request);
        $base = $this->completedFor($driver);

        $sumSince = fn (string $since): float => (float) (clone $base)
            ->where('completed_at', '>=', $since)
            ->sum('fare');

        $total = (float) (clone $base)->sum('fare');
        $count = (int) (clone $base)->count();

        $recent = (clone $base)
            ->orderByDesc('completed_at')
            ->limit(10)
            ->get(['id', 'dropoff_address', 'fare', 'currency', 'distance_km', 'duration_minutes', 'completed_at']);

        return response()->json([
            'data' => [
                'total_earned' => round($total, 2),
                'today' => round($sumSince(now()->startOfDay()->toDateTimeString()), 2),
                'week' => round($sumSince(now()->subDays(7)->toDateTimeString()), 2),
                'month' => round($sumSince(now()->subDays(30)->toDateTimeString()), 2),
                'ride_count' => $count,
                'average_fare' => $count > 0 ? round($total / $count, 2) : 0.0,
                'currency' => (string) ($recent->first()->currency ?? 'USD'),
                'driver' => [
                    'full_name' => $driver->full_name,
                    'total_rides' => (int) $driver->total_rides,
                    'rating' => $driver->rating,
                    'vehicle_type' => $driver->vehicle_type,
                ],
                'recent' => $recent,
            ],
        ]);
    }

    /**
     * Driver-scoped ride history (the rider list endpoint only shows
     * rides you requested).
     */
    public function rides(Request $request): JsonResponse
    {
        $driver = $this->driverOrFail($request);

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,requested,accepted,in_progress,completed,cancelled'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Ride::where('driver_id', $driver->id);

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $rides = $query->orderByDesc('created_at')
            ->paginate((int) ($validated['per_page'] ?? 15));

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
