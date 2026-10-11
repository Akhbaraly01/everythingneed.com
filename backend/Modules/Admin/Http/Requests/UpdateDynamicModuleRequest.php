<?php

namespace Modules\Admin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDynamicModuleRequest extends FormRequest
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
        $id = $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:160', 'alpha_dash', Rule::unique('dynamic_modules', 'slug')->ignore($id)],
            'icon' => ['nullable', 'string', 'max:80'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published'])],
            'fields' => ['sometimes', 'array', 'min:1', 'max:50'],
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
