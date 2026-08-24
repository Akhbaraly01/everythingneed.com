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

    public function prescriptions(Request $request): Response
    {
        $records = Consultation::whereHas('ticket', fn ($q) => $q->where('patient_id', $request->user()->id))
            ->with(['ticket:id,ticket_number,doctor_id,patient_id'])
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($r) => filled($r->prescription_items))
            ->map(function ($r) {
                $doctor = null;
                if ($r->ticket?->doctor_id) {
                    $doctor = Doctor::find($r->ticket->doctor_id, ['id', 'full_name', 'specialization']);
                }

                return [
                    'id' => $r->id,
                    'ticket_number' => $r->ticket?->ticket_number,
                    'date' => $r->created_at?->toISOString(),
                    'follow_up_date' => $r->follow_up_date?->toDateString(),
                    'diagnosis' => $r->diagnosis,
                    'items' => $r->prescription_items,
                    'doctor' => $doctor,
                ];
            })
            ->values();

        return Inertia::render('healthcare/Prescriptions', [
            'prescriptions' => $records,
        ]);
    }
}
