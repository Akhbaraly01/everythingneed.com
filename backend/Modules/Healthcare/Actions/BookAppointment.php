<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\Doctor;
use Core\Exceptions\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookAppointment
{
    public function execute(array $data): object
    {
        // Spec 23: the whole booking runs in one transaction with the doctor
        // row locked, so two concurrent requests for the same slot serialize
        // instead of double-booking. The partial unique index
        // (health_tickets_doctor_slot_unique) is the final backstop: a raced
        // insert surfaces the same clash message, never a 500.
        return DB::transaction(function () use ($data) {
            if (isset($data['doctor_id'])) {
                $doctor = Doctor::where('id', $data['doctor_id'])->lockForUpdate()->first();
                if (!$doctor) {
                    throw new ValidationException('Doctor not found');
                }
                if (!$doctor->is_available) {
                    throw new ValidationException('Doctor is not available');
                }
                if (!empty($data['appointment_date']) && !empty($data['appointment_time'])) {
                    $clash = HealthTicket::where('doctor_id', $doctor->id)
                        ->where('appointment_date', $data['appointment_date'])
                        ->where('appointment_time', $data['appointment_time'])
                        ->whereNotIn('status', ['cancelled', 'completed'])
                        ->exists();
                    if ($clash) {
                        throw new ValidationException('Doctor is already booked for that slot');
                    }
                }
            }

            try {
                // Nested transaction = savepoint: a raced insert rolls back to
                // the savepoint instead of poisoning the booking transaction.
                $ticket = DB::transaction(fn () => HealthTicket::create([
                    'patient_id' => $data['patient_id'],
                    'doctor_id' => $data['doctor_id'] ?? null,
                    'ticket_number' => $this->generateTicketNumber(),
                    'symptoms' => $data['symptoms'],
                    'description' => $data['description'] ?? null,
                    'consultation_type' => $data['consultation_type'] ?? 'in_person',
                    'consultation_fee' => $data['consultation_fee'] ?? null,
                    'appointment_date' => $data['appointment_date'] ?? null,
                    'appointment_time' => $data['appointment_time'] ?? null,
                    'home_address' => $data['home_address'] ?? null,
                    'is_random_assignment' => $data['is_random_assignment'] ?? false,
                    'status' => isset($data['doctor_id']) ? 'assigned' : 'pending',
                    'images' => array_values($data['images'] ?? []),
                ]));
            } catch (QueryException $e) {
                if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                    throw new ValidationException('Doctor is already booked for that slot');
                }

                throw $e;
            }

            if (isset($data['doctor_id'])) {
                $doctor = Doctor::find($data['doctor_id']);
                $type = $data['consultation_type'] ?? 'in_person';
                $feeField = $type === 'virtual'
                    ? 'virtual_fee'
                    : ($type === 'home_visit' ? 'home_visit_fee' : 'consultation_fee');
                $ticket->update([
                    'consultation_fee' => $doctor->{$feeField} ?? $doctor->consultation_fee,
                ]);
            }

            if ($data['is_random_assignment'] ?? false) {
                $query = Doctor::where('is_available', true);
                if (!empty($data['appointment_date']) && !empty($data['appointment_time'])) {
                    // Skip doctors already booked for this exact slot (parity with the
                    // explicit doctor_id clash check above); empty set = no exclusion.
                    $booked = HealthTicket::where('appointment_date', $data['appointment_date'])
                        ->where('appointment_time', $data['appointment_time'])
                        ->whereNotIn('status', ['cancelled', 'completed'])
                        ->whereNotNull('doctor_id')
                        ->pluck('doctor_id');
                    $query->whereNotIn('id', $booked);
                }
                $doctor = $query->inRandomOrder()->first();
                if ($doctor) {
                    try {
                        $type = $data['consultation_type'] ?? 'in_person';
                        $feeField = $type === 'virtual'
                            ? 'virtual_fee'
                            : ($type === 'home_visit' ? 'home_visit_fee' : 'consultation_fee');
                        DB::transaction(fn () => $ticket->update([
                            'doctor_id' => $doctor->id,
                            'status' => 'assigned',
                            'consultation_fee' => $doctor->{$feeField} ?? $doctor->consultation_fee,
                        ]));
                    } catch (QueryException $e) {
                        if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                            throw new ValidationException('Doctor is already booked for that slot');
                        }

                        throw $e;
                    }
                    event(new \Modules\Healthcare\Events\DoctorAssigned($ticket->fresh('doctor')));
                }
            }

            event(new \Modules\Healthcare\Events\AppointmentBooked($ticket->fresh('doctor')));

            return $ticket->fresh('doctor');
        });
    }

    private function generateTicketNumber(): string
    {
        return 'HT-' . strtoupper(Str::random(8));
    }
}
