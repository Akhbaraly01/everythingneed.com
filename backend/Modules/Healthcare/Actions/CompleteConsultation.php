<?php

namespace Modules\Healthcare\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\Consultation;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Pharmacy\Entities\Prescription;
use Core\Exceptions\NotFoundException;
use Core\Exceptions\ValidationException;

class CompleteConsultation
{
    public function execute(string $ticketId, array $data): void
    {
        DB::transaction(function () use ($ticketId, $data) {
            $ticket = HealthTicket::where('id', $ticketId)->lockForUpdate()->first();

            if (!$ticket) {
                throw new NotFoundException('HealthTicket', $ticketId);
            }

            if ($ticket->status !== 'in_consultation') {
                throw new ValidationException('Ticket is not in consultation');
            }

            $prescriptionItems = $data['prescription_items'] ?? null;

            if ($prescriptionItems !== null && !is_array($prescriptionItems)) {
                throw new ValidationException('prescription_items must be an array');
            }

            Consultation::create([
                'ticket_id' => $ticket->id,
                'diagnosis' => $data['diagnosis'] ?? null,
                'notes' => $data['notes'] ?? null,
                'prescription_items' => $prescriptionItems,
                'follow_up_date' => $data['follow_up_date'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            // Issue a prescription record when medication is prescribed.
            if (!empty($prescriptionItems)) {
                $consultation = Consultation::where('ticket_id', $ticket->id)->first();

                Prescription::create([
                    'code' => 'RX-'.strtoupper(Str::random(8)),
                    'patient_id' => $ticket->patient_id,
                    'doctor_id' => $ticket->doctor_id,
                    'consultation_id' => $consultation?->id,
                    'items' => $prescriptionItems,
                    'status' => Prescription::STATUS_ACTIVE,
                    'notes' => $data['notes'] ?? null,
                ]);
            }

            $ticket->update(['status' => 'completed']);
        });
    }
}
