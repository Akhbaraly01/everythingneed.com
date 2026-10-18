<?php

namespace Modules\Services\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Payments\Services\PaymentService;
use Modules\Services\Entities\ServiceBooking;
use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;

/**
 * Spec 39: admins create any supported service from the dashboard -
 * name, category, description, image, provider, pricing, location,
 * availability, booking requirement, fields, documents, payment
 * requirement, cancellation rules, delivery rules, status.
 */
class AdminServiceController extends Controller
{
    public function __construct(private PaymentService $payments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = ServiceDefinition::query()->orderByDesc('created_at');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(fn ($q) => $q->where('name', 'ilike', $term)->orWhere('category', 'ilike', $term));
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

    public function store(Request $request): JsonResponse
    {
        $service = ServiceDefinition::create($this->validated($request));

        return response()->json([
            'message' => 'Service created',
            'data' => $service,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $service = ServiceDefinition::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        return response()->json(['data' => $service]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $service = ServiceDefinition::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        $service->update($this->validated($request, $id));

        return response()->json([
            'message' => 'Service updated',
            'data' => $service->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $service = ServiceDefinition::find($id);

        if (!$service) {
            return response()->json(['message' => 'Service not found'], 404);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted']);
    }

    /** Every booking across all admin-created services (console tab). */
    public function bookings(Request $request): JsonResponse
    {
        $query = ServiceBooking::with(['service:id,name,category', 'user:id,name,email'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $bookings = $query->paginate($request->get('per_page', 15));

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

    public function updateBookingStatus(Request $request, string $bookingId): JsonResponse
    {
        $booking = ServiceBooking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['confirmed', 'completed', 'cancelled'])],
        ]);

        $booking->update(['status' => $validated['status']]);

        // Cancelling a paid booking refunds it in full (spec 39 rules).
        if ($validated['status'] === 'cancelled'
            && $booking->payment_status === ServiceBooking::PAYMENT_PAID
            && $booking->payment_id) {
            try {
                $this->payments->refund((string) $booking->payment_id);
                $booking->update(['payment_status' => ServiceBooking::PAYMENT_REFUNDED]);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Booking updated',
            'data' => $booking->fresh(),
        ]);
    }

    private function validated(Request $request, ?string $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'category' => 'required_without:category_id|string|max:50',
            'category_id' => ['nullable', 'uuid', 'exists:service_categories,id'],
            'description' => 'nullable|string|max:4000',
            'image_url' => 'nullable|url|max:500',
            'provider' => 'nullable|string|max:120',
            'pricing_mode' => ['required', Rule::in(['fixed', 'hourly', 'quote'])],
            'base_price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'location' => 'nullable|string|max:100',
            'availability' => 'nullable|array',
            'requires_booking' => 'boolean',
            'booking_fields' => 'nullable|array',
            'booking_fields.*.label' => 'required|string|max:120',
            'booking_fields.*.type' => ['nullable', Rule::in(['text', 'textarea', 'select', 'number', 'date', 'boolean'])],
            'booking_fields.*.required' => 'nullable|boolean',
            'documents' => 'nullable|array',
            'documents.*' => 'string|max:120',
            'requires_payment' => 'boolean',
            'cancellation_rules' => 'nullable|string|max:2000',
            'delivery_rules' => 'nullable|string|max:2000',
            'status' => ['required', Rule::in(['active', 'draft', 'inactive'])],
        ]);

        // Taxonomy assignment wins over free text: keep the legacy display
        // string aligned with the selected category so existing filters and
        // search keep matching (M-1 backward compatibility).
        if (! empty($data['category_id'])) {
            $category = ServiceCategory::find($data['category_id']);
            if ($category) {
                $data['category'] = $category->name;
            }
        }

        return $data;
    }
}
