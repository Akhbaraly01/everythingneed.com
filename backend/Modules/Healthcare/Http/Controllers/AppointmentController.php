<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Healthcare\Services\HealthcareService;
use Modules\Healthcare\Http\Requests\BookAppointmentRequest;
use Modules\Healthcare\Http\Resources\AppointmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(
        private HealthcareService $healthcareService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = $this->healthcareService->getPatientTickets(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => AppointmentResource::collection($tickets->items()),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        return response()->json([
            'data' => new AppointmentResource($ticket),
        ]);
    }

    public function store(BookAppointmentRequest $request): JsonResponse
    {
        $ticket = $this->healthcareService->bookAppointment(
            array_merge($request->validated(), ['patient_id' => $request->user()->id])
        );

        return response()->json([
            'message' => 'Appointment booked successfully',
            'data' => new AppointmentResource($ticket),
        ], 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        $this->healthcareService->cancelAppointment($id, $request->get('reason'));

        return response()->json([
            'message' => 'Appointment cancelled successfully',
        ]);
    }

    public function assignDoctor(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'doctor_id' => 'required|uuid|exists:doctors,id',
        ]);

        $this->healthcareService->assignDoctor($id, $validated['doctor_id']);

        return response()->json([
            'message' => 'Doctor assigned successfully',
        ]);
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'diagnosis' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:5000',
            'follow_up_date' => 'nullable|date|after:today',
            'prescription_items' => 'nullable|array',
            'prescription_items.*.name' => 'required_with:prescription_items|string|max:255',
            'prescription_items.*.dosage' => 'nullable|string|max:100',
            'prescription_items.*.frequency' => 'nullable|string|max:100',
            'prescription_items.*.duration' => 'nullable|string|max:100',
        ]);

        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        // Only the assigned doctor, the patient, or an admin may close a consultation.
        $user = $request->user();
        $isDoctor = $ticket->doctor && $user->doctor && $ticket->doctor->id === $user->doctor->id;
        $isPatient = $ticket->patient_id === $user->id;
        $isAdmin = $user->hasRole('super_admin') || $user->hasRole('administrator') || $user->hasRole('healthcare_admin');

        if (!$isDoctor && !$isPatient && !$isAdmin) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        $this->healthcareService->completeConsultation(
            $id,
            array_merge($validated, ['created_by' => $user->id])
        );

        return response()->json([
            'message' => 'Consultation completed successfully',
        ]);
    }

    /**
     * Post-consultation clinical record (patient/doctor/admin only).
     */
    public function consultationRecord(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        $record = \Modules\Healthcare\Entities\Consultation::where('ticket_id', $ticket->id)->first();

        return response()->json(['data' => $record]);
    }

    /**
     * §21 Virtual-care adapter: returns a joinable room URL for virtual
     * consultations. Provider is config-driven (default: free Jitsi rooms);
     * swapping to Zoom/Meet/Whereby is a config change, not a rewrite.
     */
    public function videoRoom(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        if ((string) $ticket->consultation_type !== 'virtual') {
            return response()->json([
                'message' => 'This appointment is not a virtual consultation.',
            ], 422);
        }

        $provider = config('services.video.provider', 'jitsi');
        $roomName = 'everythingneed-'.preg_replace('/[^A-Za-z0-9]/', '', (string) $ticket->ticket_number);

        $url = match ($provider) {
            'jitsi' => 'https://meet.jit.si/'.$roomName,
            default => rtrim((string) config('services.video.base_url', ''), '/').'/'.$roomName,
        };

        return response()->json([
            'data' => [
                'provider' => $provider,
                'room' => $roomName,
                'join_url' => $url,
            ],
        ]);
    }

    private function canAccess(Request $request, object $ticket): bool
    {
        $user = $request->user();

        if ($ticket->patient_id === $user->id) {
            return true;
        }

        if ($ticket->doctor && $user->doctor && $ticket->doctor->id === $user->doctor->id) {
            return true;
        }

        return $user->hasRole('super_admin')
            || $user->hasRole('administrator')
            || $user->hasRole('healthcare_admin');
    }
}
