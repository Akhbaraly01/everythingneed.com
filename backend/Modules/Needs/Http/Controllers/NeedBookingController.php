<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedBooking;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;

/**
 * TODO 13 scheduling + booking for needs requests.
 *
 * A booking pins a slot (start/end/timezone) to an accepted request. Safety
 * comes from the database, not the UI: one booking per request (unique),
 * provider overlap checked under a row lock inside a transaction, and a
 * 24h change policy. The request lifecycle is untouched — the booking is a
 * scheduling record with its own history, cross-linked by events.
 */
class NeedBookingController extends Controller
{
    public function __construct(
        private NotificationService $notifications
    ) {}

    /**
     * GET /api/my-bookings — upcoming bookings for the caller (as owner via
     * requests, or as the booked provider).
     */
    public function mine(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->id;

        $bookings = NeedBooking::with(['request:id,request_number,title,status', 'provider:id,name'])
            ->where(function ($w) use ($userId) {
                $w->where('provider_id', $userId)
                    ->orWhere('booked_by', $userId);
            })
            ->where('status', NeedBooking::STATUS_SCHEDULED)
            ->orderBy('scheduled_start')
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

    /**
     * GET /api/need-requests/{id}/bookings — owner, booked provider, admin.
     */
    public function forRequest(Request $request, string $id): JsonResponse
    {
        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if (! $this->canView($request, $needRequest)) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        $booking = NeedBooking::with(['provider:id,name'])
            ->where('need_request_id', $id)
            ->first();

        return response()->json(['data' => $booking]);
    }

    /**
     * POST /api/need-requests/{id}/bookings — owner pins a slot once an
     * offer is accepted. Collision-checked under lock.
     */
    public function store(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'scheduled_start' => ['required', 'date', 'after:now'],
            'scheduled_end' => ['required', 'date', 'after:scheduled_start'],
            'timezone' => ['nullable', 'string', 'max:60', 'timezone'],
        ]);

        $needRequest = NeedRequest::find($id);
        if (! $needRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ((string) $needRequest->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the owner can book this request'], 403);
        }

        if ($needRequest->status !== NeedRequest::STATUS_ACCEPTED) {
            return response()->json(['message' => "Bookings follow an accepted offer ('{$needRequest->status}')"], 422);
        }

        $provider = $needRequest->acceptedOffer;
        if (! $provider) {
            return response()->json(['message' => 'No accepted provider to book'], 422);
        }

        // Friendly pre-check (the partial unique index is the backstop).
        $live = NeedBooking::where('need_request_id', $needRequest->id)
            ->where('status', NeedBooking::STATUS_SCHEDULED)
            ->exists();
        if ($live) {
            return response()->json(['message' => 'This request is already booked'], 422);
        }

        try {
            $booking = DB::transaction(function () use ($request, $needRequest, $provider, $validated) {
                // All slot math in UTC wall time: the database session
                // timezone is not pinned to UTC on every box, so comparing
                // raw offset-bearing strings would skew by the session offset.
                $start = \Carbon\Carbon::parse($validated['scheduled_start'])->utc()->toDateTimeString();
                $end = \Carbon\Carbon::parse($validated['scheduled_end'])->utc()->toDateTimeString();

                // Serialize this provider's calendar: concurrent writers wait
                // here, then re-check overlap on the locked rows.
                $overlap = NeedBooking::where('provider_id', $provider->provider_id)
                    ->where('status', NeedBooking::STATUS_SCHEDULED)
                    ->lockForUpdate()
                    ->where(function ($w) use ($start, $end) {
                        $w->where('scheduled_start', '<', $end)
                            ->where('scheduled_end', '>', $start);
                    })
                    ->exists();

                if ($overlap) {
                    throw new \Core\Exceptions\ValidationException('The provider is already booked for that slot');
                }

                return NeedBooking::create([
                    'need_request_id' => $needRequest->id,
                    'provider_id' => $provider->provider_id,
                    'booked_by' => $request->user()->id,
                    'scheduled_start' => $start,
                    'scheduled_end' => $end,
                    'timezone' => $validated['timezone'] ?? 'UTC',
                    'status' => NeedBooking::STATUS_SCHEDULED,
                ]);
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json(['message' => 'This request is already booked'], 422);
        }

        NeedRequestEvent::create([
            'need_request_id' => $needRequest->id,
            'actor_id' => $request->user()->id,
            'from_status' => $needRequest->status,
            'to_status' => $needRequest->status,
            'action' => 'booked',
            'note' => 'Slot booked: ' . $booking->scheduled_start->toIso8601String(),
        ]);

        $this->notifications->notify(
            (string) $provider->provider_id,
            'New booking',
            "You are booked for '{$needRequest->title}' on {$booking->scheduled_start->toDateTimeString()}.",
            'need_booked',
            $needRequest->id
        );

        return response()->json(['message' => 'Booking confirmed', 'data' => $booking], 201);
    }

    /**
     * POST /api/need-bookings/{id}/reschedule — owner or booked provider.
     * Free outside 24h; locked inside it.
     */
    public function reschedule(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'scheduled_start' => ['required', 'date', 'after:now'],
            'scheduled_end' => ['required', 'date', 'after:scheduled_start'],
        ]);

        $booking = NeedBooking::find($id);
        if (! $booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if (! $this->canManage($request, $booking)) {
            return response()->json(['message' => 'Only the owner or the booked provider can reschedule'], 403);
        }

        if ($booking->status !== NeedBooking::STATUS_SCHEDULED) {
            return response()->json(['message' => "Only scheduled bookings can be moved ('{$booking->status}')"], 422);
        }

        if ($booking->isLockedByPolicy()) {
            return response()->json(['message' => 'Free rescheduling closes 24 hours before the slot'], 422);
        }

        try {
            DB::transaction(function () use ($booking, $validated) {
                $start = \Carbon\Carbon::parse($validated['scheduled_start'])->utc()->toDateTimeString();
                $end = \Carbon\Carbon::parse($validated['scheduled_end'])->utc()->toDateTimeString();

                $overlap = NeedBooking::where('provider_id', $booking->provider_id)
                    ->where('status', NeedBooking::STATUS_SCHEDULED)
                    ->where('id', '!=', $booking->id)
                    ->lockForUpdate()
                    ->where(function ($w) use ($start, $end) {
                        $w->where('scheduled_start', '<', $end)
                            ->where('scheduled_end', '>', $start);
                    })
                    ->exists();

                if ($overlap) {
                    throw new \Core\Exceptions\ValidationException('The provider is already booked for that slot');
                }

                $booking->update([
                    'scheduled_start' => $start,
                    'scheduled_end' => $end,
                    'reschedule_count' => $booking->reschedule_count + 1,
                ]);
            });
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        NeedRequestEvent::create([
            'need_request_id' => $booking->need_request_id,
            'actor_id' => $request->user()->id,
            // to_status is NOT NULL: anchor the note at the live status.
            'from_status' => $booking->request?->status,
            'to_status' => $booking->request?->status ?? NeedRequest::STATUS_ACCEPTED,
            'action' => 'booking_rescheduled',
            'note' => 'Moved to ' . $booking->fresh()->scheduled_start->toIso8601String(),
        ]);

        $counterparty = (string) $request->user()->id === (string) $booking->provider_id
            ? $booking->booked_by
            : $booking->provider_id;
        $this->notifications->notify(
            (string) $counterparty,
            'Booking rescheduled',
            "A booking moved to {$booking->fresh()->scheduled_start->toDateTimeString()}.",
            'need_booking_rescheduled',
            $booking->need_request_id
        );

        return response()->json(['message' => 'Booking rescheduled', 'data' => $booking->fresh()]);
    }

    /**
     * POST /api/need-bookings/{id}/cancel — owner or booked provider, with a
     * reason. Cancelling the slot never cancels the request itself.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $booking = NeedBooking::find($id);
        if (! $booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if (! $this->canManage($request, $booking)) {
            return response()->json(['message' => 'Only the owner or the booked provider can cancel'], 403);
        }

        if ($booking->status !== NeedBooking::STATUS_SCHEDULED) {
            return response()->json(['message' => "Only scheduled bookings can be cancelled ('{$booking->status}')"], 422);
        }

        $booking->update([
            'status' => NeedBooking::STATUS_CANCELLED,
            'cancel_reason' => $validated['reason'],
        ]);

        NeedRequestEvent::create([
            'need_request_id' => $booking->need_request_id,
            'actor_id' => $request->user()->id,
            // to_status is NOT NULL: anchor the note at the live status.
            'from_status' => $booking->request?->status,
            'to_status' => $booking->request?->status ?? NeedRequest::STATUS_ACCEPTED,
            'action' => 'booking_cancelled',
            'note' => $validated['reason'],
        ]);

        $counterparty = (string) $request->user()->id === (string) $booking->provider_id
            ? $booking->booked_by
            : $booking->provider_id;
        $this->notifications->notify(
            (string) $counterparty,
            'Booking cancelled',
            "A booking starting {$booking->scheduled_start->toDateTimeString()} was cancelled: {$validated['reason']}",
            'need_booking_cancelled',
            $booking->need_request_id
        );

        return response()->json(['message' => 'Booking cancelled', 'data' => $booking->fresh()]);
    }

    private function canView(Request $request, NeedRequest $needRequest): bool
    {
        $userId = (string) $request->user()->id;

        return $userId === (string) $needRequest->user_id
            || ($needRequest->acceptedOffer && $userId === (string) $needRequest->acceptedOffer->provider_id)
            || $request->user()->hasRole('super_admin')
            || $request->user()->hasRole('administrator');
    }

    private function canManage(Request $request, NeedBooking $booking): bool
    {
        $userId = (string) $request->user()->id;

        return $userId === (string) $booking->booked_by
            || $userId === (string) $booking->provider_id;
    }
}
