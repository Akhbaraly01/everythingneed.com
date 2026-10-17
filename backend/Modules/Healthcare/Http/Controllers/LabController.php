<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Healthcare\Actions\BookLabTest;
use Modules\Healthcare\Entities\LabBooking;
use Modules\Healthcare\Entities\LabTest;
use Modules\Payments\Services\PaymentService;

/**
 * Spec 24: the laboratory domain - real test catalog (preparation
 * instructions, turnaround time), booking with slot locking, payment and
 * booking history. Replaces the previous doctor-derived lab stubs.
 */
class LabController extends Controller
{
    public function __construct(
        private BookLabTest $bookLabTest,
        private PaymentService $payments
    ) {}

    /** GET /api/health/labs - public active catalog. */
    public function index(Request $request): JsonResponse
    {
        $query = LabTest::query()->active();

        if ($category = trim((string) $request->get('category'))) {
            $query->where('category', 'ilike', $category);
        }

        if ($search = trim((string) $request->get('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $tests = $query->orderBy('name')
            ->paginate((int) $request->get('per_page', 30))
            ->withQueryString();

        return response()->json([
            'data' => $tests->items(),
            'meta' => [
                'current_page' => $tests->currentPage(),
                'last_page' => $tests->lastPage(),
                'per_page' => $tests->perPage(),
                'total' => $tests->total(),
            ],
        ]);
    }

    /** GET /api/health/labs/{id} - single test detail. */
    public function show(string $id): JsonResponse
    {
        $test = LabTest::query()->active()->find($id);
        if (!$test) {
            return response()->json(['message' => 'Lab test not found'], 404);
        }

        return response()->json(['data' => $test]);
    }

    /** POST /api/health/labs/book - authenticated booking. */
    public function book(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lab_test_id'      => 'required|uuid|exists:lab_tests,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|date_format:H:i',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $booking = $this->bookLabTest->execute(array_merge(
            $validated,
            ['patient_id' => $request->user()->id]
        ));

        return response()->json([
            'message' => 'Lab test booked successfully',
            'data'    => $booking->fresh('labTest'),
        ], 201);
    }

    /** GET /api/health/labs/bookings - the patient's own bookings. */
    public function myBookings(Request $request): JsonResponse
    {
        $bookings = LabBooking::with('labTest:id,name,category,result_time_hours')
            ->where('patient_id', $request->user()->id)
            ->orderByDesc('appointment_date')
            ->paginate((int) $request->get('per_page', 15));

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'per_page'     => $bookings->perPage(),
                'total'        => $bookings->total(),
            ],
        ]);
    }

    /** GET /api/health/labs/bookings/{id} - single booking (owner only). */
    public function bookingShow(Request $request, string $id): JsonResponse
    {
        $booking = LabBooking::with('labTest')->find($id);
        if (!$booking) {
            return response()->json(['message' => 'Lab booking not found'], 404);
        }
        if ((string) $booking->patient_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        return response()->json(['data' => $booking]);
    }

    /** POST /api/health/labs/bookings/{id}/pay - pay a pending booking. */
    public function pay(Request $request, string $id): JsonResponse
    {
        $booking = LabBooking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Lab booking not found'], 404);
        }
        if ((string) $booking->patient_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }
        if ($booking->status === LabBooking::STATUS_CANCELLED) {
            return response()->json(['message' => 'Cannot pay a cancelled booking'], 422);
        }
        if ($booking->is_paid) {
            return response()->json([
                'message' => 'Booking already paid',
                'data'    => $booking,
            ]);
        }

        $request->validate(['method' => 'required|string|max:30']);

        $fee = (float) $booking->price;

        if ($fee <= 0) {
            $booking->update(['is_paid' => true, 'status' => LabBooking::STATUS_CONFIRMED]);

            return response()->json(['message' => 'Booking paid', 'data' => $booking->fresh('labTest')]);
        }

        $payment = $this->payments->charge([
            'user_id' => (string) $request->user()->id,
            'amount' => $fee,
            'currency' => \Core\Support\Currencies::default(),
            'method' => $request->input('method'),
            'idempotency_key' => 'lab-'.$booking->id,
            'purpose' => 'lab_booking_payment',
            'metadata' => [
                'lab_booking_id' => $booking->id,
                'booking_number' => $booking->booking_number,
            ],
        ]);

        $booking->update([
            'is_paid' => true,
            'status' => LabBooking::STATUS_CONFIRMED,
            'payment_reference' => (string) ($payment['id'] ?? Str::random(16)),
        ]);

        return response()->json([
            'message' => 'Booking paid',
            'data'    => $booking->fresh('labTest'),
        ]);
    }

    /** POST /api/health/labs/bookings/{id}/cancel - cancel (owner). */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $booking = LabBooking::find($id);
        if (!$booking) {
            return response()->json(['message' => 'Lab booking not found'], 404);
        }
        if ((string) $booking->patient_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }
        if ($booking->status === LabBooking::STATUS_COMPLETED) {
            return response()->json(['message' => 'Cannot cancel a completed booking'], 422);
        }

        $booking->update(['status' => LabBooking::STATUS_CANCELLED]);

        return response()->json(['message' => 'Booking cancelled', 'data' => $booking->fresh('labTest')]);
    }

    // ------------------------------------------------------------------
    // Admin console (healthcare workspace)
    // ------------------------------------------------------------------

    /** GET /api/admin/healthcare/labs - every test incl. inactive. */
    public function adminList(Request $request): JsonResponse
    {
        $query = LabTest::query()->orderBy('name');

        if ($search = trim((string) $request->get('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%");
            });
        }

        $tests = $query->paginate((int) $request->get('per_page', 50))->withQueryString();

        return response()->json([
            'data' => $tests->items(),
            'meta' => [
                'current_page' => $tests->currentPage(),
                'last_page'    => $tests->lastPage(),
                'per_page'     => $tests->perPage(),
                'total'        => $tests->total(),
            ],
        ]);
    }

    /** POST /api/admin/healthcare/labs - create a lab test. */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                     => 'required|string|max:150',
            'description'              => 'nullable|string|max:1000',
            'category'                 => 'required|string|max:100',
            'price'                    => 'required|numeric|min:0|max:100000',
            'preparation_instructions' => 'nullable|string|max:1000',
            'result_time_hours'        => 'required|integer|min:1|max:720',
            'is_active'                => 'boolean',
        ]);

        $test = LabTest::create([
            ...$validated,
            'slug' => Str::slug($validated['name']).'-'.Str::lower(Str::random(6)),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['message' => 'Lab test created', 'data' => $test], 201);
    }

    /** PUT /api/admin/healthcare/labs/{id} - update a lab test. */
    public function update(Request $request, string $id): JsonResponse
    {
        $test = LabTest::find($id);
        if (!$test) {
            return response()->json(['message' => 'Lab test not found'], 404);
        }

        $validated = $request->validate([
            'name'                     => 'sometimes|string|max:150',
            'description'              => 'nullable|string|max:1000',
            'category'                 => 'sometimes|string|max:100',
            'price'                    => 'sometimes|numeric|min:0|max:100000',
            'preparation_instructions' => 'nullable|string|max:1000',
            'result_time_hours'        => 'sometimes|integer|min:1|max:720',
            'is_active'                => 'boolean',
        ]);

        if ($validated === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        $test->update($validated);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'update',
                'entity_type' => 'lab_test',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => $validated,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the update.
        }

        return response()->json(['message' => 'Lab test updated', 'data' => $test->fresh()]);
    }

    /**
     * DELETE /api/admin/healthcare/labs/{id} - remove a lab test.
     * Soft delete; refused while bookings reference the test.
     * (role: super_admin, administrator, healthcare_admin)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $test = LabTest::find($id);
        if (!$test) {
            return response()->json(['message' => 'Lab test not found'], 404);
        }

        if ($test->bookings()->exists()) {
            return response()->json([
                'message' => 'This lab test has bookings and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $name = $test->name;
        $test->delete();

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'delete',
                'entity_type' => 'lab_test',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['name' => $name],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break deletion.
        }

        return response()->json(['message' => 'Lab test deleted']);
    }

    /** GET /api/admin/healthcare/labs/bookings - every booking across patients. */
    public function adminBookings(Request $request): JsonResponse
    {
        $query = LabBooking::with('labTest:id,name,category', 'patient:id,name,email')
            ->orderByDesc('appointment_date');

        if ($status = trim((string) $request->get('status'))) {
            $query->where('status', $status);
        }

        $bookings = $query->paginate((int) $request->get('per_page', 50))->withQueryString();

        return response()->json([
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page'    => $bookings->lastPage(),
                'per_page'     => $bookings->perPage(),
                'total'        => $bookings->total(),
            ],
        ]);
    }
}
