<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateModuleEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => ['nullable', 'string', 'max:160'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published'])],
            'data' => ['sometimes', 'array', 'max:100'],
        ];
    }
}
