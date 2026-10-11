<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreModuleEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Entry payload shape is structural only; values are validated against
     * the module's field defs in the controller (unknown keys stripped,
     * required + types enforced).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => ['nullable', 'string', 'max:160'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'published'])],
            'data' => ['required', 'array', 'max:100'],
        ];
    }
}
