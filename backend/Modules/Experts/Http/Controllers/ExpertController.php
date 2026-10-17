<?php

namespace Modules\Experts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Core\Services\Contracts\DoctorQueryInterface;
use Modules\Experts\Entities\ExpertBooking;
use Modules\Payments\Services\PaymentService;

class ExpertController extends Controller
{
    public function __construct(
        private DoctorQueryInterface $doctors,
        private PaymentService $payments
    ) {}

    public function index(Request $request): JsonResponse
    {
        $experts = $this->doctors->paginateDoctors([
            'specialty' => $request->query('specialty'),
            'available' => $request->boolean('available'),
            'qualification' => $request->query('qualification'),
            'experience_min' => $request->query('experience_min'),
            'per_page'  => (int) $request->get('per_page', 15),
        ]);

        return response()->json([
            'data' => $experts->items(),
            'meta' => [
                'current_page' => $experts->currentPage(),
                'last_page' => $experts->lastPage(),
                'per_page' => $experts->perPage(),
                'total' => $experts->total(),
            ],
        ]);
    }

    /** Distinct expert categories derived from real specializations. */
    public function categories(): JsonResponse
    {
        // Cross-module read goes through the Core contract (Healthcare owns
        // the doctors table).
        $categories = $this->doctors->distinctSpecializations();

        return response()->json([
            'data' => collect($categories)->map(fn ($c) => [
                'name' => $c,
                'slug' => \Illuminate\Support\Str::slug((string) $c),
            ])->values(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $expert = $this->doctors->findDoctor($id);

        if (!$expert) {
            return response()->json(['message' => 'Expert not found'], 404);
        }

        $reviews = DB::table('expert_reviews')
            ->where('expert_id', $id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // The profile page reads the expert directly from `data` (with the
        // name/specialty/image_url aliases added by the query layer); reviews
        // ride alongside rather than wrapping it.
        return response()->json(['data' => $expert, 'reviews' => $reviews]);
    }

    /** Public review list for an expert profile (newest first, paginated). */
    public function reviews(Request $request, string $id): JsonResponse
    {
        $reviews = DB::table('expert_reviews as er')
            ->leftJoin('users as u', 'u.id', '=', 'er.user_id')
            ->where('er.expert_id', $id)
            ->orderByDesc('er.created_at')
            ->select(['er.id', 'er.rating', 'er.comment', 'er.created_at', 'u.name as user_name'])
            ->paginate(min((int) $request->get('per_page', 10), 30));

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    public function storeReview(Request $request, string $id): JsonResponse
    {        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // expert_reviews.id is a uuid PK with no DB default - insertGetId
        // would send null and violate NOT NULL, so generate the id here.
        $reviewId = (string) \Illuminate\Support\Str::uuid();
        DB::table('expert_reviews')->insert([
            'id' => $reviewId,
            'expert_id' => $id,
            'user_id' => $request->user()->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Review submitted', 'id' => $reviewId], 201);
    }

    public function availability(Request $request, string $id): JsonResponse
    {
        $row = DB::table('expert_availability')
            ->where('expert_id', $id)
            ->where('is_available', true)
            ->first();

        // The profile grid renders a date => [times] map; surface the next
        // available moment as a single slot (the table stores no schedule).
        $slots = [];
        if ($row && $row->next_available_at) {
            $next = \Carbon\Carbon::parse($row->next_available_at);
            $slots[$next->toDateString()] = [$next->format('H:i')];
        }

        return response()->json(['data' => $slots]);
    }

    /**
     * Book an expert session (spec 60: availability + booking + payment).
     * The slot is protected by the partial unique index on
     * expert_bookings (expert_id, scheduled_date, scheduled_time).
     */
    public function storeBooking(Request $request, string $id): JsonResponse
    {
        $expert = $this->doctors->findDoctor($id);

        if (!$expert) {
            return response()->json(['message' => 'Expert not found'], 404);
        }

        $validated = $request->validate([
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_time' => 'required|date_format:H:i',
            'mode' => 'required|in:virtual,in_person',
            'notes' => 'nullable|string|max:1000',
        ]);

        $amount = round((float) ($expert->consultation_fee ?? $expert->hourly_rate ?? 0), 2);

        try {
            $booking = DB::transaction(function () use ($expert, $validated, $request, $amount) {
                $clash = ExpertBooking::where('expert_id', $expert->id)
                    ->where('scheduled_date', $validated['scheduled_date'])
                    ->where('scheduled_time', $validated['scheduled_time'])
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->exists();

                if ($clash) {
                    throw new \Core\Exceptions\ValidationException('That slot is already booked');
                }

                return ExpertBooking::create([
                    'booking_number' => 'EXP-'.strtoupper(\Illuminate\Support\Str::random(8)),
                    'expert_id' => $expert->id,
                    'user_id' => $request->user()->id,
                    'scheduled_date' => $validated['scheduled_date'],
                    'scheduled_time' => $validated['scheduled_time'],
                    'duration_minutes' => 60,
                    'mode' => $validated['mode'],
                    'notes' => $validated['notes'] ?? null,
                    'amount' => $amount,
                    'currency' => \Core\Support\Currencies::default(),
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                ]);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Partial unique index: a concurrent booking won the slot.
            if (($e->errorInfo[0] ?? null) === '23505') {
                return response()->json(['message' => 'That slot is already booked'], 422);
            }
            throw $e;
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Booking created. Complete payment to confirm it.',
            'data' => $booking,
        ], 201);
    }

    /** The authenticated user's expert bookings, newest first. */
    public function myBookings(Request $request): JsonResponse
    {
        $bookings = ExpertBooking::with('expert:full_name,specialization,avatar_url')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('scheduled_date')
            ->orderByDesc('scheduled_time')
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

    public function cancelBooking(Request $request, string $bookingId): JsonResponse
    {
        $booking = ExpertBooking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot cancel a '{$booking->status}' booking"], 422);
        }

        $booking->update(['status' => 'cancelled']);

        if ($booking->payment_status === 'paid' && $booking->payment_id) {
            try {
                $this->payments->refund((string) $booking->payment_id);
                $booking->update(['payment_status' => 'refunded']);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Booking cancelled',
            'data' => $booking->fresh(),
        ]);
    }

    /** Pay the expert fee; amount comes from the booking row, never input. */
    public function payBooking(Request $request, string $bookingId): JsonResponse
    {
        $booking = ExpertBooking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot pay for a '{$booking->status}' booking"], 422);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'message' => 'Booking already paid',
                'data' => $booking,
            ]);
        }

        $request->validate(['method' => 'required|string|max:30']);

        if ((float) $booking->amount <= 0) {
            $booking->update(['status' => 'confirmed', 'payment_status' => 'paid', 'paid_at' => now()]);

            return response()->json([
                'message' => 'Payment succeeded. Booking confirmed.',
                'data' => $booking->fresh(),
            ]);
        }

        $payment = $this->payments->charge([
            'user_id' => (string) $request->user()->id,
            'amount' => (float) $booking->amount,
            'currency' => $booking->currency ?? \Core\Support\Currencies::default(),
            'method' => $request->input('method'),
            'idempotency_key' => 'expb-'.$booking->id,
            'purpose' => 'expert_booking',
            'metadata' => [
                'booking_id' => $booking->id,
                'booking_number' => $booking->booking_number,
            ],
        ]);

        if ($payment->status !== 'succeeded') {
            return response()->json([
                'message' => 'Payment is processing',
                'data' => ['payment_status' => 'processing'],
            ], 202);
        }

        $booking->update([
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'payment_id' => $payment->id,
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment succeeded. Booking confirmed.',
            'data' => $booking->fresh(),
        ]);
    }
}
