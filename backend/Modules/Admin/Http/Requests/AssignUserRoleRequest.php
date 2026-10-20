<?php

namespace Modules\Admin\Http\Requests;

use Core\Services\Contracts\RoleRegistryInterface;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignUserRoleRequest extends FormRequest
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
            'user_id' => 'required|uuid|exists:users,id',
            'role' => ['required', 'string', Rule::in(app(RoleRegistryInterface::class)->all())],
        ];
    }
}
