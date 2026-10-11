<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\HealthServiceRequest;

/**
 * H-D: Health Bookings "Others" - free-form custom health service requests.
 *
 * Patients describe a specific need (category + details + preferred date);
 * the healthcare console triages the queue (contact -> schedule -> close,
 * or cancel) and may attach a professional. No money moves here - if the
 * request turns into a visit, that booking flows through appointments.
 */
class ServiceRequestController extends Controller
{
    public function __construct(
        private AuditServiceInterface $audit,
    ) {}

    /** POST /api/health/service-requests - authed patient files a request. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category' => 'required|string|max:60',
            'title' => 'required|string|max:180',
            'details' => 'required|string|max:4000',
            'preferred_date' => 'nullable|date|after:now',
            'location' => 'nullable|string|max:500',
            'contact_phone' => 'nullable|string|max:40',
            'idempotency_key' => 'nullable|string|max:120',
        ]);

        $serviceRequest = DB::transaction(function () use ($data, $request) {
            if (!empty($data['idempotency_key'])) {
                $existing = HealthServiceRequest::where('idempotency_key', $data['idempotency_key'])
                    ->where('patient_id', $request->user()->id)
                    ->first();
                if ($existing) {
                    return $existing;
                }
            }

            return HealthServiceRequest::create([
                'patient_id' => $request->user()->id,
                'request_number' => $this->generateRequestNumber(),
                'category' => $data['category'],
                'title' => $data['title'],
                'details' => $data['details'],
                'preferred_date' => $data['preferred_date'] ?? null,
                'location' => $data['location'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
                'status' => HealthServiceRequest::STATUS_OPEN,
                'idempotency_key' => $data['idempotency_key'] ?? null,
            ]);
        });

        $this->auditRequest('health.request.filed', $serviceRequest, $request->user()->id, [
            'status' => HealthServiceRequest::STATUS_OPEN,
        ]);

        return response()->json([
            'message' => 'Service request submitted',
            'data' => $serviceRequest,
        ], 201);
    }

    /** GET /api/health/service-requests/mine - patient's own requests. */
    public function mine(Request $request): JsonResponse
    {
        $query = HealthServiceRequest::where('patient_id', $request->user()->id)
            ->with('assignedDoctor:id,full_name,specialization,profession')
            ->orderByDesc('created_at');

        return response()->json($query->paginate(15)->withQueryString());
    }

    /** GET /api/admin/healthcare/service-requests - triage queue (all statuses). */
    public function adminList(Request $request): JsonResponse
    {
        $query = HealthServiceRequest::with(['patient:id,name,email', 'assignedDoctor:id,full_name,profession'])
            ->orderByDesc('created_at');

        if (($status = $request->query('status')) && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q
                ->where('request_number', 'ilike', "%{$search}%")
                ->orWhere('title', 'ilike', "%{$search}%"));
        }

        return response()->json($query->paginate(20)->withQueryString());
    }

    /** PUT /api/admin/healthcare/service-requests/{id} - advance the request. */
    public function adminDecide(Request $request, string $id): JsonResponse
    {
        $serviceRequest = HealthServiceRequest::find($id);
        if (!$serviceRequest) {
            return response()->json(['message' => 'Service request not found'], 404);
        }
        if (in_array($serviceRequest->status, HealthServiceRequest::TERMINAL, true)) {
            return response()->json(['message' => 'Closed or cancelled requests cannot be changed'], 422);
        }

        $data = $request->validate([
            'action' => 'required|in:contact,schedule,close,cancel',
            'assigned_doctor_id' => 'nullable|uuid|exists:doctors,id',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $next = [
            'contact' => HealthServiceRequest::STATUS_CONTACTED,
            'schedule' => HealthServiceRequest::STATUS_SCHEDULED,
            'close' => HealthServiceRequest::STATUS_CLOSED,
            'cancel' => HealthServiceRequest::STATUS_CANCELLED,
        ][$data['action']];

        // Forward-only lifecycle: open -> contacted/scheduled/cancelled,
        // contacted -> scheduled/cancelled, scheduled -> closed/cancelled.
        $allowed = [
            HealthServiceRequest::STATUS_OPEN => [
                HealthServiceRequest::STATUS_CONTACTED,
                HealthServiceRequest::STATUS_SCHEDULED,
                HealthServiceRequest::STATUS_CANCELLED,
            ],
            HealthServiceRequest::STATUS_CONTACTED => [
                HealthServiceRequest::STATUS_SCHEDULED,
                HealthServiceRequest::STATUS_CANCELLED,
            ],
            HealthServiceRequest::STATUS_SCHEDULED => [
                HealthServiceRequest::STATUS_CLOSED,
                HealthServiceRequest::STATUS_CANCELLED,
            ],
        ];
        if (!in_array($next, $allowed[$serviceRequest->status] ?? [], true)) {
            return response()->json([
                'message' => "Cannot move a {$serviceRequest->status} request to {$next}",
            ], 422);
        }

        $serviceRequest->update([
            'status' => $next,
            'assigned_doctor_id' => $data['assigned_doctor_id'] ?? $serviceRequest->assigned_doctor_id,
            'admin_note' => $data['admin_note'] ?? $serviceRequest->admin_note,
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        $this->auditRequest('health.request.'.$data['action'], $serviceRequest, $request->user()->id, [
            'status' => $next,
        ]);

        return response()->json([
            'message' => 'Service request updated',
            'data' => $serviceRequest->fresh(['patient:id,name', 'assignedDoctor:id,full_name']),
        ]);
    }

    private function generateRequestNumber(): string
    {
        return 'HSR-'.strtoupper(Str::random(8));
    }

    private function auditRequest(string $action, HealthServiceRequest $serviceRequest, string $actorId, array $newValues): void
    {
        try {
            $this->audit->log([
                'action' => $action,
                'entity_type' => 'health_service_request',
                'entity_id' => $serviceRequest->id,
                'performed_by' => $actorId,
                'old_values' => [],
                'new_values' => $newValues,
            ]);
        } catch (\Throwable) {
        }
    }
}
