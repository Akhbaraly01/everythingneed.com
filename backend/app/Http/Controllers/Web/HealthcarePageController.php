<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Healthcare\Entities\Consultation;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\HealthTicket;

class HealthcarePageController extends Controller
{
    public function index(Request $request): Response
    {
        $doctors = Doctor::where('is_available', true)
            ->orderByDesc('rating')
            ->paginate(12, ['id', 'full_name', 'specialization', 'qualification', 'experience_years', 'consultation_fee', 'virtual_fee', 'avatar_url', 'is_available', 'rating'])
            ->withQueryString();

        if ($request->user()) {
            $appointments = HealthTicket::with('doctor:id,full_name,specialization')
                ->where('patient_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->paginate(5)
                ->withQueryString();
        } else {
            $appointments = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 5);
        }

        return Inertia::render('healthcare/Index', [
            'doctors' => $doctors,
            'appointments' => $appointments,
        ]);
    }

    public function appointments(Request $request): Response
    {
        $tickets = HealthTicket::with('doctor:id,full_name,specialization,consultation_fee')
            ->where('patient_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(12);

        return Inertia::render('healthcare/Appointments', [
            'appointments' => $tickets,
        ]);
    }

    public function appointmentDetail(Request $request, string $id): Response
    {
        $ticket = HealthTicket::with('doctor:id,full_name,specialization,qualification')
            ->findOrFail($id);

        abort_unless((string) $ticket->patient_id === (string) $request->user()->id, 403,
            'This appointment belongs to another patient.');

        $record = Consultation::where('ticket_id', $ticket->id)->first();

        return Inertia::render('healthcare/AppointmentShow', [
            'appointment' => $ticket,
            'consultation' => $record,
        ]);
    }

    public function book(string $id): Response
    {
        $doctor = Doctor::findOrFail($id);

        return Inertia::render('healthcare/Book', [
            'doctor' => $this->presentDoctor($doctor),
            'availability' => $this->weeklyAvailability($doctor),
        ]);
    }

    public function doctorProfile(string $id): Response
    {
        $doctor = Doctor::findOrFail($id);

        return Inertia::render('healthcare/DoctorProfile', [
            'doctor' => $this->presentDoctor($doctor),
            'availability' => $this->weeklyAvailability($doctor),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentDoctor(Doctor $doctor): array
    {
        return [
            'id' => $doctor->id,
            'name' => $doctor->full_name,
            'specialty' => $doctor->specialization,
            'bio' => $doctor->qualification,
            'image_url' => $doctor->avatar_url,
            'rating' => $doctor->rating !== null ? (float) $doctor->rating : null,
            'consultation_fee' => (float) $doctor->consultation_fee,
            'years_experience' => (int) $doctor->experience_years,
        ];
    }

    /**
     * Default weekly availability for bookable doctors. There is no
     * per-slot store yet, so available doctors offer standard daily slots.
     *
     * @return array<string, array<int, array{time: string, available: bool}>>
     */
    private function weeklyAvailability(Doctor $doctor): array
    {
        if (!$doctor->is_available) {
            return [];
        }

        $slots = [];
        foreach (['09:00', '11:00', '14:00', '16:00'] as $time) {
            $slots[] = ['time' => $time, 'available' => true];
        }

        $days = [];
        for ($i = 1; $i <= 7; $i++) {
            $days[now()->addDays($i)->toDateString()] = $slots;
        }

        return $days;
    }

    public function prescriptions(Request $request): Response
    {
        // H-B: the prescriptions table is the single source of truth. The
        // consultation's prescription_items JSON is a snapshot written at
        // issue time and can drift (e.g. expiry, fulfilment), so the page
        // reads the materialised row instead.
        $records = \Modules\Pharmacy\Entities\Prescription::with(['doctor:id,full_name,specialization', 'consultation:diagnosis,follow_up_date'])
            ->where('patient_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'code' => $p->code,
                    'status' => $p->status,
                    'is_expired' => $p->isExpired(),
                    'expires_at' => $p->expires_at?->toIso8601String(),
                    'created_at' => $p->created_at?->toIso8601String(),
                    'notes' => $p->notes,
                    'items' => $p->items,
                    'diagnosis' => $p->consultation?->diagnosis,
                    'follow_up_date' => $p->consultation?->follow_up_date,
                    'doctor' => $p->doctor ? [
                        'full_name' => $p->doctor->full_name,
                        'specialization' => $p->doctor->specialization,
                    ] : null,
                ];
            })
            ->values();

        return Inertia::render('healthcare/Prescriptions', [
            'prescriptions' => $records,
        ]);
    }

    public function records(Request $request): Response
    {
        $user = $request->user();

        $tickets = HealthTicket::with('doctor:id,full_name,specialization')
            ->where('patient_id', $user->id)
            ->orderByDesc('appointment_date')
            ->limit(50)
            ->get();

        $consultations = Consultation::whereHas('ticket', fn ($q) => $q->where('patient_id', $user->id))
            ->with('ticket:id,ticket_number,appointment_date')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $prescriptions = \Modules\Pharmacy\Entities\Prescription::with('doctor:id,full_name,specialization')
            ->where('patient_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return Inertia::render('healthcare/Records', [
            'tickets' => $tickets,
            'consultations' => $consultations,
            'prescriptions' => $prescriptions,
        ]);
    }

    /**
     * H-D: Health Bookings hub - every bookable healthcare service in one
     * place. Sections fetch their own APIs client-side; the hub itself
     * needs no props.
     */
    public function bookings(): Response
    {
        return Inertia::render('healthcare/Bookings');
    }
}
