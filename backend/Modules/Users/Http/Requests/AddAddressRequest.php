<?php

namespace Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'line1' => 'required|string|max:200',
            'line2' => 'nullable|string|max:200',
            'city' => 'required|string|max:100',
            'region' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'required|string|size:2',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'is_default' => 'boolean',
        ];
    }
}
