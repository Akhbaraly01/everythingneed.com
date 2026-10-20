<?php

namespace Modules\Healthcare\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'symptoms' => $this->symptoms,
            'description' => $this->description,
            'consultation_type' => $this->consultation_type,
            'consultation_fee' => $this->consultation_fee,
            'appointment_date' => $this->appointment_date,
            'appointment_time' => $this->appointment_time,
            'home_address' => $this->home_address,
            'status' => $this->status,
            'payment_status' => $this->payment_status ?? 'unpaid',
            'paid_at' => $this->paid_at,
            // L-H-3: receipt facts for paid appointments (own records only —
            // the resource is only served to the patient/doctor/admin).
            'payment' => $this->payment_id && $this->payment ? [
                'id' => $this->payment->id,
                'reference' => $this->payment->reference,
                'amount' => (float) $this->payment->amount,
                'currency' => $this->payment->currency,
                'method' => $this->payment->method,
                'status' => $this->payment->status,
                'paid_at' => $this->paid_at,
            ] : null,
            'images' => $this->images ?? [],
            'doctor' => [
                'id' => $this->doctor?->id,
                'full_name' => $this->doctor?->full_name,
                'specialization' => $this->doctor?->specialization,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
