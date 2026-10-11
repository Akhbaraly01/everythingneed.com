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
            'doctor' => [
                'id' => $this->doctor?->id,
                'full_name' => $this->doctor?->full_name,
                'specialization' => $this->doctor?->specialization,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
