<?php

namespace Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => 'required|string|regex:/^\+?[1-9]\d{6,14}$/',
        ];
    }
}
