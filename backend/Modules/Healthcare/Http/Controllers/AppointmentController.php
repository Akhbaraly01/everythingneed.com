<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Healthcare\Services\HealthcareService;
use Modules\Healthcare\Http\Requests\BookAppointmentRequest;
use Modules\Healthcare\Http\Resources\AppointmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Payments\Services\PaymentService;

class AppointmentController extends Controller
{
    public function __construct(
        private HealthcareService $healthcareService,
        private PaymentService $payments
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

    /**
     * Admin view: every health ticket with requester + doctor (console).
     */
    public function adminTickets(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:all,pending,assigned,in_consultation,completed,cancelled'],
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = \Illuminate\Support\Facades\DB::table('health_tickets as ht')
            ->leftJoin('users as u', 'u.id', '=', 'ht.patient_id')
            ->leftJoin('doctors as d', 'd.id', '=', 'ht.doctor_id')
            ->select([
                'ht.id', 'ht.ticket_number', 'ht.symptoms', 'ht.consultation_type',
                'ht.consultation_fee', 'ht.appointment_date', 'ht.appointment_time', 'ht.status', 'ht.created_at',
                'u.name as patient_name', 'u.email as patient_email',
                'd.full_name as doctor_name',
            ])
            ->whereNull('ht.deleted_at')
            ->orderByDesc('ht.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ht.ticket_number', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%")
                    ->orWhere('d.full_name', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('ht.status', $status);
        }

        $total = (clone $query)->count();
        $page = (int) ($validated['page'] ?? 1);
        $rows = $query->offset(($page - 1) * 15)->limit(15)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => 15, 'total' => $total],
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

    public function start(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        $this->healthcareService->startConsultation($id);

        return response()->json([
            'message' => 'Consultation started',
        ]);
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

        $wasPaid = $ticket->payment_status === 'paid';

        $this->healthcareService->cancelAppointment($id, $request->get('reason'));

        // Paid consultations are refunded in full when the patient cancels.
        if ($wasPaid && $ticket->payment_id) {
            try {
                $this->payments->refund((string) $ticket->payment_id);
                $ticket->update(['payment_status' => 'refunded']);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'Appointment cancelled successfully',
        ]);
    }

    /**
     * Pay the consultation fee for the patient's own appointment
     * (spec 97 workflow: Book -> Pay -> Appointment). The fee is
     * derived server-side; the client only picks the payment method.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $ticket = $this->healthcareService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if ((string) $ticket->patient_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'You do not have access to this appointment'], 403);
        }

        if ($ticket->status === 'cancelled') {
            return response()->json(['message' => 'Cannot pay a cancelled appointment'], 422);
        }

        if ($ticket->payment_status === 'paid') {
            return response()->json([
                'message' => 'Appointment already paid',
                'data' => new AppointmentResource($ticket),
            ]);
        }

        $request->validate(['method' => 'required|string|max:30']);

        $fee = (float) $ticket->consultation_fee;

        if ($fee <= 0) {
            $ticket->update(['payment_status' => 'paid', 'paid_at' => now()]);

            return response()->json([
                'message' => 'Appointment paid',
                'data' => new AppointmentResource($ticket->fresh()),
            ]);
        }

        $payment = $this->payments->charge([
            'user_id' => (string) $request->user()->id,
            'amount' => $fee,
            'currency' => \Core\Support\Currencies::default(),
            'method' => $request->input('method'),
            'idempotency_key' => 'appt-'.$ticket->id,
            'purpose' => 'appointment_payment',
            'metadata' => [
                'appointment_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
            ],
        ]);

        if ($payment->status !== 'succeeded') {
            return response()->json([
                'message' => 'Payment is processing',
                'data' => ['payment_status' => 'processing'],
            ], 202);
        }

        $ticket->update([
            'payment_status' => 'paid',
            'payment_id' => $payment->id,
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Appointment paid',
            'data' => new AppointmentResource($ticket->fresh()),
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

        // Only the assigned doctor or an admin may close a consultation.
        $user = $request->user();
        $isDoctor = $ticket->doctor && $user->doctor && $ticket->doctor->id === $user->doctor->id;
        $isAdmin = $user->hasRole('super_admin') || $user->hasRole('administrator') || $user->hasRole('healthcare_admin');

        if (!$isDoctor && !$isAdmin) {
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
