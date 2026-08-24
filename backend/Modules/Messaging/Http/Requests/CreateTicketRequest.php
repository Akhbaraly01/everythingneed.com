<?php

namespace Modules\Messaging\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
            'department_id' => 'nullable|uuid|exists:departments,id',
        ];
    }
}
