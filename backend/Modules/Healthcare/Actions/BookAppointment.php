<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\Doctor;
use Core\Exceptions\ValidationException;
use Illuminate\Support\Str;

class BookAppointment
{
    public function execute(array $data): object
    {
        $ticket = HealthTicket::create([
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'] ?? null,
            'ticket_number' => $this->generateTicketNumber(),
            'symptoms' => $data['symptoms'],
            'description' => $data['description'] ?? null,
            'consultation_type' => $data['consultation_type'] ?? 'in_person',
            'consultation_fee' => $data['consultation_fee'] ?? null,
            'appointment_date' => $data['appointment_date'] ?? null,
            'appointment_time' => $data['appointment_time'] ?? null,
            'is_random_assignment' => $data['is_random_assignment'] ?? false,
            'status' => isset($data['doctor_id']) ? 'assigned' : 'pending',
        ]);

        if (isset($data['doctor_id'])) {
            // Explicit doctor selection: apply their fee immediately.
            $doctor = Doctor::find($data['doctor_id']);
            if ($doctor) {
                $feeField = ($data['consultation_type'] ?? 'in_person') === 'virtual'
                    ? 'virtual_fee' : 'consultation_fee';
                $ticket->update([
                    'consultation_fee' => $doctor->{$feeField} ?? $doctor->consultation_fee,
                ]);
            }
        }

        if ($data['is_random_assignment'] ?? false) {
            $doctor = Doctor::where('is_available', true)->inRandomOrder()->first();
            if ($doctor) {
                $ticket->update([
                    'doctor_id' => $doctor->id,
                    'status' => 'assigned',
                    'consultation_fee' => $doctor->consultation_fee,
                ]);
            }
        }

        return $ticket->fresh('doctor');
    }

    private function generateTicketNumber(): string
    {
        return 'HT-' . strtoupper(Str::random(8));
    }
}
