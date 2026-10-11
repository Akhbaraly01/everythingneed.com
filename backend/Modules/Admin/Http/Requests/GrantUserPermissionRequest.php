<?php

namespace Modules\Admin\Http\Requests;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GrantUserPermissionRequest extends FormRequest
{
    /**
     * Least-privilege delegation (W2): same downhill-only rule as role
     * grants - the granter must hold the permission they bestow.
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
            'permission' => ['required', 'string', Rule::in(PermissionSeeder::CATALOG)],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
