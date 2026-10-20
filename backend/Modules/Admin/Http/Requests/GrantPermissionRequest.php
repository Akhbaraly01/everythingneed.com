<?php

namespace Modules\Admin\Http\Requests;

use Core\Services\Contracts\RoleRegistryInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GrantPermissionRequest extends FormRequest
{
    /**
     * Least-privilege delegation (W2): the granter must hold the permission
     * they grant. super_admin holds everything, so existing flows are
     * unaffected; if the route ever admits scoped granters, privilege can
     * only flow downhill, never uphill.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null || ! is_string($this->input('permission'))) {
            return false;
        }

        return app(\Core\Services\Contracts\EffectivePermissionResolverInterface::class)
            ->has($user, $this->input('permission'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', Rule::in(app(RoleRegistryInterface::class)->all())],
            'permission' => ['required', 'string', Rule::in(PermissionSeeder::CATALOG)],
        ];
    }
}
