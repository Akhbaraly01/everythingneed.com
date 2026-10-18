<?php

namespace Modules\Services\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Exceptions\ValidationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Services\PaymentService;
use Modules\Services\Entities\ServiceBooking;
use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;

/**
 * Public side of the admin-defined service catalogue (spec 39/100):
 * discoverable through /api/services and bookable through
 * /api/services/{id}/book - no developer page per service.
 */
class ServiceCatalogController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = ServiceDefinition::query()
            ->where('status', ServiceDefinition::STATUS_ACTIVE)
            ->orderByDesc('created_at');

        if ($request->filled('category')) {
            // M-1: prefer the taxonomy slug (category + its subcategories so
            // the "Home Cleaning" tile surfaces "Deep Cleaning" jobs too);
            // legacy free-text rows ("Building Services" vs filter "building")
            // keep matching via exact token or "token ..." prefix.
            $slug = $request->string('category')->toString();
            $category = ServiceCategory::where('slug', $slug)->first();
            $categoryIds = $category
                ? [$category->id, ...$category->children()->pluck('id')->all()]
                : [];

            $query->where(function ($q) use ($categoryIds, $slug) {
                if ($categoryIds !== []) {
                    $q->whereIn('category_id', $categoryIds);
                }
                $q->orWhere('category', $slug)
                    ->orWhere('category', 'ilike', $slug.'%');
            });
        }
        if ($request->filled('location')) {
            $query->where('location', 'ilike', '%'.$request->string('location')->toString().'%');
        }
        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $term)->orWhere('description', 'ilike', $term));
        }

        $services = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $services->items(),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $service = ServiceDefinition::where('status', ServiceDefinition::STATUS_ACTIVE)->find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return response()->json(['data' => $service->load('categoryRef:id,name,slug,icon,color,parent_id')]);
    }

    /**
     * GET /api/service-categories - active taxonomy tree (roots with active
     * children) plus a count of live services per node, powering the
     * 7-icons + See more grid on the services surfaces.
     */
    public function categories(): JsonResponse
    {
        $liveServices = fn ($q) => $q->where('status', ServiceDefinition::STATUS_ACTIVE);

        $categories = ServiceCategory::whereNull('parent_id')
            ->where('is_active', true)
            ->with(['children' => fn ($q) => $q
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->withCount(['services as services_count' => $liveServices])])
            ->withCount(['services as services_count' => $liveServices])
            ->orderBy('sort_order')
            ->get();

        // Grid counts are "services reachable from this tile": a root tile
        // aggregates its subcategories so "Home Cleaning 3" is truthful when
        // the jobs sit in "Deep Cleaning".
        foreach ($categories as $root) {
            $root->services_count = (int) $root->services_count
                + $root->children->sum(fn ($child) => (int) $child->services_count);
        }

        return response()->json(['data' => $categories]);
    }

    /**
     * Book an active service. The fee snapshot comes from the definition
     * (spec 100: Home Cleaning becomes bookable the moment it is created).
     */
    public function book(Request $request, string $id): JsonResponse
    {
        $service = ServiceDefinition::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        if ($service->status !== ServiceDefinition::STATUS_ACTIVE) {
            return response()->json(['message' => 'This service is not available'], 422);
        }

        if (!$service->requires_booking) {
            return response()->json(['message' => 'This service does not require booking'], 422);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'answers' => 'nullable|array',
        ]);

        $booking = DB::transaction(function () use ($service, $validated, $request) {
            return ServiceBooking::create([
                'booking_number' => 'SVC-'.strtoupper(\Illuminate\Support\Str::random(8)),
                'service_id' => $service->id,
                'user_id' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
                'answers' => $validated['answers'] ?? null,
                'amount' => (float) $service->base_price,
                'currency' => $service->currency ?? \Core\Support\Currencies::default(),
                'status' => ServiceBooking::STATUS_PENDING,
                'payment_status' => ServiceBooking::PAYMENT_UNPAID,
            ]);
        });

        return response()->json([
            'message' => $service->requires_payment
                ? 'Booking created. Complete payment to confirm it.'
                : 'Booking created',
            'data' => $booking,
        ], 201);
    }

    public function myBookings(Request $request): JsonResponse
    {
        $bookings = ServiceBooking::with('service:id,name,category,image_url,requires_payment')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
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
        $booking = ServiceBooking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot cancel a '{$booking->status}' booking"], 422);
        }

        $booking->update(['status' => ServiceBooking::STATUS_CANCELLED]);

        if ($booking->payment_status === ServiceBooking::PAYMENT_PAID && $booking->payment_id) {
            try {
                $this->payments->refund((string) $booking->payment_id);
                $booking->update(['payment_status' => ServiceBooking::PAYMENT_REFUNDED]);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Booking cancelled',
            'data' => $booking->fresh(),
        ]);
    }

    /** Pay a service booking; amount is derived from the booking row. */
    public function payBooking(Request $request, string $bookingId): JsonResponse
    {
        $booking = ServiceBooking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ((string) $booking->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this booking'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => "Cannot pay for a '{$booking->status}' booking"], 422);
        }

        if ($booking->payment_status === ServiceBooking::PAYMENT_PAID) {
            return response()->json(['message' => 'Booking already paid', 'data' => $booking]);
        }

        $request->validate(['method' => 'required|string|max:30']);

        if ((float) $booking->amount <= 0) {
            $booking->update([
                'status' => ServiceBooking::STATUS_CONFIRMED,
                'payment_status' => ServiceBooking::PAYMENT_PAID,
                'paid_at' => now(),
            ]);

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
            'idempotency_key' => 'svcb-'.$booking->id,
            'purpose' => 'service_booking',
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
            'status' => ServiceBooking::STATUS_CONFIRMED,
            'payment_status' => ServiceBooking::PAYMENT_PAID,
            'payment_id' => $payment->id,
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment succeeded. Booking confirmed.',
            'data' => $booking->fresh(),
        ]);
    }
}
