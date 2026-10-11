<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KycSubmitRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (auth/sanctum + gates) is the guard;
        // this request class owns payload validation only.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', 'max:50'],
            'document_number' => ['required', 'string', 'max:100'],
            'document_front_path' => ['nullable', 'string', 'max:500'],
            'document_back_path' => ['nullable', 'string', 'max:500'],
            'full_name' => ['nullable', 'string', 'max:150'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'nationality' => ['nullable', 'string', 'size:3'],
            'address' => ['nullable', 'string', 'max:500'],
            'id_expiry_date' => ['nullable', 'date', 'after:today'],
        ];
    }
}
