<?php

namespace Modules\Vendors\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'store_name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string|max:2000',
        ];
    }
}
