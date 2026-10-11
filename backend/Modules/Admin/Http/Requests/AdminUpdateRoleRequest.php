<?php

namespace Modules\Admin\Http\Requests;

use Core\Enums\AppRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (auth/sanctum + gates) is the guard;
        // this request class owns payload validation only.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', Rule::in(AppRole::values())],
        ];
    }
}
