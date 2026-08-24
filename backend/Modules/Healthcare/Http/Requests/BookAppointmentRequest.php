<?php

namespace Modules\Healthcare\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'doctor_id' => 'nullable|uuid|exists:doctors,id',
            'symptoms' => 'required|string|max:2000',
            'description' => 'nullable|string|max:2000',
            'consultation_type' => 'nullable|string|in:in_person,virtual',
            'appointment_date' => 'nullable|date|after:now',
            'appointment_time' => 'nullable|string',
            'is_random_assignment' => 'boolean',
        ];
    }
}
