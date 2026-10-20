<?php

namespace Modules\Admin\Http\Requests;

use Core\Enums\AppRole;
use Core\Services\Contracts\EffectivePermissionResolverInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCustomRoleRequest extends FormRequest
{
    /**
     * Least-privilege delegation: every permission selected at creation
     * must already be held by the creator.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        $resolver = app(EffectivePermissionResolverInterface::class);

        foreach ((array) $this->input('permissions', []) as $permission) {
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
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'slug' => [
                'nullable', 'string', 'max:40',
                'regex:/^[a-z][a-z0-9_]{2,39}$/',
                Rule::notIn(AppRole::values()),
                Rule::unique('custom_roles', 'slug'),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['nullable', 'array', 'max:210'],
            'permissions.*' => ['string', 'distinct', Rule::in(PermissionSeeder::CATALOG)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug must be 3-40 characters of lowercase letters, numbers and underscores, starting with a letter.',
            'slug.not_in' => 'This slug is reserved by a built-in role.',
            'slug.unique' => 'A role with this slug already exists.',
        ];
    }
}
