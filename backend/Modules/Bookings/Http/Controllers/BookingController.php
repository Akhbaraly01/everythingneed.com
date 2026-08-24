<?php

namespace Modules\Bookings\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Bookings\Entities\Booking;
use Core\Exceptions\NotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    private const TRANSITIONS = [
        'confirm' => ['pending', 'confirmed'],
        'complete' => ['confirmed', 'in_progress'],
        'check-in' => ['confirmed', 'checked_in'],
        'check-out' => ['checked_in', 'checked_out'],
    ];

    public function index(Request $request): JsonResponse
    {
        $query = Booking::with('user')
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('service_type')) {
            $query->where('service_type', $request->service_type);
        }

        $bookings = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $booking = Booking::with('user')->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ($booking->user_id !== $request->user()->id && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        return response()->json(['data' => $booking]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_type' => 'required|string|max:100',
            'service_id' => 'nullable|uuid',
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_time' => 'required|string|max:20',
            'notes' => 'nullable|string|max:2000',
        ]);

        $booking = Booking::create([
            'user_id' => $request->user()->id,
            'service_type' => $validated['service_type'],
            'service_id' => $validated['service_id'] ?? null,
            'details' => [
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_time' => $validated['scheduled_time'],
                'notes' => $validated['notes'] ?? null,
            ],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Booking created successfully',
            'data' => $booking,
        ], 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $booking = Booking::find($id);

        if (!$booking) {
            throw new NotFoundException('Booking', $id);
        }

        if ($booking->user_id !== $request->user()->id && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (in_array($booking->status, ['cancelled', 'completed', 'checked_out'])) {
            return response()->json([
                'message' => "Booking cannot be cancelled from status '{$booking->status}'",
            ], 422);
        }

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => 'cancelled']);

            // Release inventory held by this booking
            if ($booking->service_type === 'flight' && $booking->service_id) {
                $seats = (int) ($booking->details['seat_count'] ?? 0);

                if ($seats > 0) {
                    DB::table('flights')
                        ->where('id', $booking->service_id)
                        ->lockForUpdate()
                        ->increment('seats_available', $seats);
                }
            }
        });

        $booking->refresh();

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'data' => $booking,
        ]);
    }

    public function confirm(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'confirm');
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'complete');
    }

    public function checkIn(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'check-in');
    }

    public function checkOut(Request $request, string $id): JsonResponse
    {
        return $this->transition($request, $id, 'check-out');
    }

    private function transition(Request $request, string $id, string $action): JsonResponse
    {
        [$fromStatuses, $newStatus] = self::TRANSITIONS[$action];

        $booking = Booking::find($id);

        if (!$booking) {
            throw new NotFoundException('Booking', $id);
        }

        if ($booking->user_id !== $request->user()->id && !$this->isAdmin($request)) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (!in_array($booking->status, $fromStatuses, true)) {
            return response()->json([
                'message' => "Cannot {$action} a booking in status '{$booking->status}'",
            ], 422);
        }

        $booking->update(['status' => $newStatus]);

        return response()->json([
            'message' => ucfirst(str_replace('-', ' ', $action)) . ' successful',
            'data' => $booking->fresh(),
        ]);
    }

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }
}
