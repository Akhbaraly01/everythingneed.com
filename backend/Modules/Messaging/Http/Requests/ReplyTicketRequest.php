<?php

namespace Modules\Messaging\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReplyTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'message' => 'required|string|max:5000',
            // Agents may file internal notes; the controller enforces that
            // non-staff callers cannot set this flag.
            'is_internal' => ['nullable', 'boolean'],
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'nullable|string|max:500',
        ];
    }
}
