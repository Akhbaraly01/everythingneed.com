<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDynamicModuleRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:160', 'alpha_dash', 'unique:dynamic_modules,slug'],
            'icon' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'published'])],
            'fields' => ['required', 'array', 'min:1', 'max:50'],
            'fields.*.key' => ['required', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:160'],
            'fields.*.type' => ['required', 'string', Rule::in(['text', 'textarea', 'number', 'boolean', 'date', 'url', 'image'])],
            'fields.*.required' => ['nullable', 'boolean'],
            'list_config' => ['nullable', 'array'],
            'requires_approval' => ['nullable', 'boolean'],
            'approval_roles' => ['nullable', 'array', 'max:5'],
            'approval_roles.*' => ['string', Rule::in(\Modules\Admin\Http\Controllers\AdminRbacController::ROLES)],
        ];
    }
}
