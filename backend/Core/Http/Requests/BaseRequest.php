<?php

namespace Core\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class BaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    abstract public function rules(): array;

    public function messages(): array
    {
        return [];
    }
}
