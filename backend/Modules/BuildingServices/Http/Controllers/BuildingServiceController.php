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
        $validated = $request->validate([
            'worker_type' => 'required|string|max:100',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'address' => 'required|string|max:500',
            'service_category' => 'nullable|string|max:100',
            // WorkerProfile links here with ?worker=<uuid>; honour an
            // explicitly chosen worker instead of auto-assigning any.
            'worker_id' => 'nullable|uuid|exists:service_workers,id',
        ]);

        $user = $request->user();

        // Explicit choice: the worker must be available and free at the slot.
        $chosen = null;
        if (!empty($validated['worker_id'])) {
            $chosen = \Modules\BuildingServices\Entities\ServiceWorker::find($validated['worker_id']);
            if (!$chosen || !$chosen->is_available) {
                return response()->json(['message' => 'Selected worker is not available'], 422);
            }
            $clash = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('worker_id', $chosen->id)
                ->where('scheduled_date', $validated['scheduled_date'])
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->when($validated['scheduled_time'] ?? null, fn ($q) => $q->where('scheduled_time', $validated['scheduled_time']))
                ->exists();
            if ($clash) {
                return response()->json(['message' => 'Selected worker is already booked for that slot'], 422);
            }
        }

        $booking = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $user, $chosen) {
            $booking = \Modules\BuildingServices\Entities\BuildingServiceBooking::create([
                'user_id' => $user->id,
                'worker_type' => $validated['worker_type'],
                'service_category' => $validated['service_category'] ?? 'general',
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_time' => $validated['scheduled_time'] ?? null,
                'description' => $validated['description'] ?? '',
                'address' => $validated['address'],
                'status' => 'pending',
                'worker_id' => $chosen?->id,
            ]);

            // Spec 59: assignment is real - bind an available worker of the
            // requested type who is free at that slot, if one exists. An
            // explicitly chosen (validated) worker takes precedence.
            if (!$chosen) {
                $worker = $this->findAvailableWorker(
                    $validated['worker_type'],
                    $validated['scheduled_date'],
                    $validated['scheduled_time'] ?? null
                );
                if ($worker) {
                    $booking->update(['worker_id' => $worker->id]);
                }
            }

            return $booking->fresh();
        });

        if ($booking->worker_id) {
            $this->notify(
                (string) $booking->user_id,
                'Worker assigned',
                "A worker was assigned to your {$booking->worker_type} booking.",
                $booking->id
            );
        }

        return response()->json([
            'message' => 'Service booked successfully',
            'data' => [
                'id' => $booking->id,
                'worker_assigned' => $booking->worker_id !== null,
                'worker_id' => $booking->worker_id,
            ],
        ], 201);
    }

    /**
     * Assign (or reassign) a worker to a booking. The worker must exist, be
     * available and be free at the booking slot.
     */
    public function assignWorker(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'worker_id' => 'required|uuid|exists:service_workers,id',
            'quoted_price' => 'nullable|numeric|min:0',
        ]);

        $booking = \Modules\BuildingServices\Entities\BuildingServiceBooking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if (!$this->canManage($request->user(), $booking, 'building_services.workers.manage')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array($booking->status, ['completed', 'cancelled'], true)) {
            return response()->json(['message' => "Cannot assign a {$booking->status} booking"], 422);
        }

        $worker = \Modules\BuildingServices\Entities\ServiceWorker::find($validated['worker_id']);
        if (!$worker->is_available) {
            return response()->json(['message' => 'Worker is not available'], 422);
        }

        $clash = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('worker_id', $worker->id)
            ->where('id', '!=', $booking->id)
            ->where('scheduled_date', $booking->scheduled_date)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->when($booking->scheduled_time, fn ($q) => $q->where('scheduled_time', $booking->scheduled_time))
            ->exists();
        if ($clash) {
            return response()->json(['message' => 'Worker is already booked for that slot'], 422);
        }

        $booking->update([
            'worker_id' => $worker->id,
            'quoted_price' => $validated['quoted_price'] ?? $booking->quoted_price,
        ]);

        $this->notify(
            (string) $booking->user_id,
            'Worker assigned',
            "A worker was assigned to your {$booking->worker_type} booking.",
            $booking->id
        );

        return response()->json([
            'message' => 'Worker assigned',
            'data' => $booking->fresh(),
        ]);
    }

    /** Complete or cancel a booking (worker, owner or building admin). */
    public function transition(Request $request, string $id): JsonResponse
    {
        // W10: confirmed/in_progress are reachable states - the admin
        // console filter and detail page already surface them.
        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,in_progress,completed,cancelled',
        ]);

        $booking = \Modules\BuildingServices\Entities\BuildingServiceBooking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if (!$this->canManage($request->user(), $booking, 'building_services.bookings.manage')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array($booking->status, ['completed', 'cancelled'], true)) {
            return response()->json(['message' => "Booking is already {$booking->status}"], 422);
        }

        $booking->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "Booking {$validated['status']}",
            'data' => $booking->fresh(),
        ]);
    }

    private function findAvailableWorker(?string $workerType, ?string $date, ?string $time): ?object
    {
        $query = \Modules\BuildingServices\Entities\ServiceWorker::where('is_available', true)
            ->when($workerType, fn ($q) => $q->where('worker_type', $workerType))
            ->orderBy('id');

        foreach ($query->get() as $worker) {
            $clash = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('worker_id', $worker->id)
                ->where('scheduled_date', $date)
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->when($time, fn ($q) => $q->where('scheduled_time', $time))
                ->exists();
            if (!$clash) {
                return $worker;
            }
        }

        return null;
    }

    /**
     * The owner and the assigned worker always keep their self-service
     * branch; everyone else needs the granular permission or one of the
     * legacy console roles.
     */
    private function canManage($user, $booking, string $permission): bool
    {
        if ((string) $booking->user_id === (string) $user->id) {
            return true;
        }

        if ($booking->worker_id) {
            $isWorker = \Modules\BuildingServices\Entities\ServiceWorker::where('id', $booking->worker_id)
                ->where('user_id', $user->id)
                ->exists();
            if ($isWorker) {
                return true;
            }
        }

        if (method_exists($user, 'hasPermission') && $user->hasPermission($permission)) {
            return true;
        }

        if (method_exists($user, 'hasRole')) {
            foreach (['super_admin', 'administrator', 'building_admin'] as $role) {
                if ($user->hasRole($role)) {
                    return true;
                }
            }
        }

        return false;
    }

    /** Spec 50 transactional fan-out; best-effort, never breaks booking. */
    private function notify(string $userId, string $title, string $message, ?string $relatedId = null): void
    {
        try {
            app(\Core\Services\Contracts\NotificationServiceInterface::class)
                ->notify($userId, $title, $message, 'booking', $relatedId);
        } catch (\Throwable) {
        }
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = DB::table('building_service_bookings')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $query = DB::table('building_service_bookings');
        $user = $request->user();
        $isAdmin = $user->hasRole('super_admin') || $user->hasRole('administrator');

        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        $booking = $query->find($id);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        return response()->json(['data' => $booking]);
    }

    public function worker(string $id): JsonResponse
    {
        $w = \Modules\BuildingServices\Entities\ServiceWorker::find($id);
        if (!$w) {
            return response()->json(['message' => 'Worker not found'], 404);
        }

        return response()->json(['data' => $w]);
    }

    public function workers(Request $request): JsonResponse
    {
        $q = \Modules\BuildingServices\Entities\ServiceWorker::query();
        if ($t = $request->get('type')) {
            $q->where('worker_type', $t);
        }

        return response()->json(['data' => $q->where('is_available', true)->limit(20)->get()]);
    }

    public function bookings(Request $request): JsonResponse
    {
        $bookings = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    public function booking(Request $request, string $id): JsonResponse
    {
        $b = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('user_id', $request->user()->id)->find($id);
        if (!$b) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        return response()->json(['data' => $b]);
    }
}
