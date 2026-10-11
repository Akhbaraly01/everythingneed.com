<?php

namespace Modules\Admin\Http\Requests;

use Core\Enums\PermissionScope;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Admin\Http\Controllers\AdminRbacController;

class GrantScopeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware (role:super_admin) is the guard; this request
        // class owns payload validation only.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $holderType = $this->input('holder_type');

        return [
            'holder_type' => ['required', 'in:role,user'],
            'holder_id' => [
                'required', 'string', 'max:40',
                $holderType === 'role'
                    ? Rule::in(AdminRbacController::ROLES)
                    : Rule::exists('users', 'id'),
            ],
            'permission' => ['required', 'string', Rule::in(PermissionSeeder::CATALOG)],
            'scope' => ['required', 'string', Rule::in(PermissionScope::values())],
            // DOMAIN is only meaningful with its key (e.g. department id).
            'scope_value' => ['nullable', 'string', 'max:100', 'required_if:scope,domain'],
        ];
    }
}
