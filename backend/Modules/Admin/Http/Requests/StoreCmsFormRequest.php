<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCmsFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $create = $this->isMethod('POST');

        return [
            'name' => [$create ? 'required' : 'nullable', 'string', 'max:160'],
            'slug' => [
                $create ? 'required' : 'nullable',
                'string',
                'max:160',
                'alpha_dash',
                Rule::unique('cms_forms', 'slug')->ignore($this->route('formId')),
            ],
            'status' => ['nullable', 'string', Rule::in(['draft', 'published'])],
            'fields' => [$create ? 'required' : 'nullable', 'array', 'min:1', 'max:50'],
            'fields.*.key' => ['required', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:160'],
            'fields.*.type' => [
                'required',
                'string',
                Rule::in([
                    'text', 'textarea', 'number', 'email', 'phone', 'date',
                    'select', 'multiselect', 'checkbox', 'radio',
                    'file', 'image', 'address', 'country', 'currency',
                ]),
            ],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.visibility' => ['nullable', 'string', Rule::in(['public', 'hidden'])],
            'fields.*.options' => ['nullable', 'array', 'max:100'],
            'fields.*.options.*' => ['required', 'string', 'max:160'],
            'fields.*.max' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'fields.*.ordering' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'fields.*.key.regex' => 'Field keys must be lowercase snake_case (a-z, 0-9, _).',
            'fields.*.type.in' => 'Unsupported field type.',
            'fields.*.distinct' => 'Duplicate field key.',
        ];
    }
}
