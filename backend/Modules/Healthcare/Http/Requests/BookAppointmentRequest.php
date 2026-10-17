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
            'consultation_type' => 'nullable|string|in:in_person,virtual,home_visit',
            'appointment_date' => 'nullable|date|after:now',
            'appointment_time' => 'nullable|string',
            'home_address' => 'nullable|string|max:500',
            'is_random_assignment' => 'boolean',
            // Optional injury/prescription evidence: uploader-produced URLs
            // under the patient's own scope, never raw client strings.
            'images' => 'nullable|array|max:5',
            'images.*' => [
                'nullable', 'url', 'max:2048',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $scope = 'uploads/u/'.auth()->id().'/';
                    if (!str_contains((string) $value, $scope)) {
                        $fail('Each image must be uploaded to your own library first.');
                    }
                },
            ],
        ];
    }
}
