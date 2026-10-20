<?php

namespace Modules\Admin\Http\Requests;

use Core\Services\Contracts\EffectivePermissionResolverInterface;
use Core\Services\Contracts\RoleRegistryInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkRolePermissionRequest extends FormRequest
{
    /**
     * Least-privilege delegation: the granter must hold every permission
     * they are granting (super_admin holds everything, so the console
     * flow is unaffected).
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        $resolver = app(EffectivePermissionResolverInterface::class);

        foreach ((array) $this->input('grant', []) as $permission) {
            if (! is_string($permission) || ! $resolver->has($user, $permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', 'max:40', Rule::in(app(RoleRegistryInterface::class)->all())],
            'grant' => ['nullable', 'array', 'max:210'],
            'grant.*' => ['string', 'distinct', Rule::in(PermissionSeeder::CATALOG)],
            'revoke' => ['nullable', 'array', 'max:210'],
            'revoke.*' => ['string', 'distinct', Rule::in(PermissionSeeder::CATALOG)],
        ];
    }
}
