<?php

namespace Modules\Healthcare\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'full_name' => 'required|string|max:255',
            'specialization' => 'required|string|max:100',
            'qualification' => 'required|string|max:255',
            'experience_years' => 'required|integer|min:0',
            'consultation_fee' => 'required|numeric|min:0',
            'virtual_fee' => 'nullable|numeric|min:0',
            'avatar_url' => 'nullable|url|max:500',
        ];
    }
}
