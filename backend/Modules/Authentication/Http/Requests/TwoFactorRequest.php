<?php

namespace Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|size:6',
        ];
    }
}
