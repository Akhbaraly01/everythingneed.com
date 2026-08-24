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
        ];
    }
}
