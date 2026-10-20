<?php

namespace Modules\Admin\Http\Requests;

use Core\Services\Contracts\RoleRegistryInterface;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminStoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route-gated: permission:users.users.create + can:manageUsers
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'role' => ['required', 'string', Rule::in(app(RoleRegistryInterface::class)->all())],
        ];
    }
}
