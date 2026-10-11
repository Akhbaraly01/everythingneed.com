<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KycReviewRequest extends FormRequest
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
            'status' => ['required', 'in:approved,rejected,requires_action'],
            // Every non-approval tells the user exactly what to fix.
            'rejection_reason' => ['required_unless:status,approved', 'nullable', 'string', 'max:500'],
        ];
    }
}
