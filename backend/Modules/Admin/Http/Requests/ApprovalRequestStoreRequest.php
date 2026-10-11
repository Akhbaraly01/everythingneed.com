<?php

namespace Modules\Admin\Http\Requests;

use Core\Enums\AppRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApprovalRequestStoreRequest extends FormRequest
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
            'type' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9_.\-]+$/'],
            'title' => ['required', 'string', 'max:255'],
            'approver_roles' => ['required', 'array', 'min:1', 'max:10'],
            'approver_roles.*' => ['nullable', 'string', 'max:40', Rule::in(AppRole::values())],
            'subject_type' => ['nullable', 'string', 'max:64'],
            'subject_id' => ['nullable', 'string', 'max:64'],
            'payload' => ['nullable', 'array'],
        ];
    }
}
