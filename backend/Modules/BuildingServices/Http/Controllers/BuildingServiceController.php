<?php

namespace Modules\BuildingServices\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BuildingServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = DB::table('service_workers')
            ->where('is_available', true)
            ->orderByDesc('rating')
            ->get();

        return response()->json(['data' => $services]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'worker_type' => 'required|string|max:100',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'address' => 'required|string|max:500',
            'service_category' => 'nullable|string|max:100',
        ]);

        $user = $request->user();

        $booking = DB::table('building_service_bookings')->insertGetId([
            'user_id' => $user->id,
            'worker_type' => $request->worker_type,
            'service_category' => $request->service_category ?? 'general',
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'description' => $request->description,
            'address' => $request->address,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Service booked successfully',
            'data' => ['id' => $booking],
        ], 201);
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = DB::table('building_service_bookings')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function show(string $id): JsonResponse
    {
        $booking = DB::table('building_service_bookings')->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        return response()->json(['data' => $booking]);
    }
}
