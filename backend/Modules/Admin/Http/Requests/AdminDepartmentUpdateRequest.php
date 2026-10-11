<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminDepartmentUpdateRequest extends FormRequest
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
            'name' => [
                'sometimes', 'required', 'string', 'max:120',
                Rule::unique('departments', 'name')
                    ->whereNull('deleted_at')
                    ->ignore($this->route('id')),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
