<?php

namespace Modules\Wallet\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
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
            'to_user_id' => ['required', 'uuid', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:1'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }
}
