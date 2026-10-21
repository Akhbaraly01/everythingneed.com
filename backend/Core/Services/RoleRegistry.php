<?php

namespace Core\Services;

use Core\Enums\AppRole;
use Core\Services\Contracts\RoleRegistryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Single source of truth for "which roles exist": the 40 canonical
 * AppRole cases plus admin-created rows in custom_roles. Every write
 * flushes the shared rbac.matrix cache so grants apply immediately.
 */
class RoleRegistry extends BaseService implements RoleRegistryInterface
{
    /** @var list<string>|null */
    private ?array $memoCustom = null;

    /** @var list<string>|null */
    private ?array $memoRetired = null;

    public function canonical(): array
    {
        return AppRole::values();
    }

    public function custom(): array
    {
        return $this->memoCustom ??= DB::table('custom_roles')
            ->orderBy('name')
            ->pluck('slug')
            ->all();
    }

    public function all(): array
    {
        $retired = $this->retired();

        return array_values(array_unique([
            ...array_values(array_diff($this->canonical(), $retired)),
            ...$this->custom(),
        ]));
    }

    public function exists(string $role): bool
    {
        return in_array($role, $this->all(), true);
    }

    public function allIncludingRetired(): array
    {
        return array_values(array_unique([...$this->canonical(), ...$this->custom()]));
    }

    public function isCore(string $role): bool
    {
        return in_array($role, $this->canonical(), true);
    }

    public function retired(): array
    {
        return $this->memoRetired ??= DB::table('retired_roles')
            ->orderBy('role')
            ->pluck('role')
            ->all();
    }

    public function isRetired(string $role): bool
    {
        return in_array($role, $this->retired(), true);
    }

    /**
     * Takes a built-in role out of service. The role itself lives in the
     * AppRole enum, so "deleting" it means: hide it everywhere and drop
     * its grants/scopes. A super admin can restore it later.
     */
    public function retire(string $role, ?string $actorId, ?string $reason = null): bool
    {
        if (! $this->isCore($role)) {
            return false;
        }

        DB::transaction(function () use ($role, $actorId, $reason) {
            DB::table('role_permissions')->where('role', $role)->delete();
            DB::table('permission_scopes')
                ->where('holder_type', 'role')
                ->where('holder_id', $role)
                ->delete();

            DB::table('retired_roles')->updateOrInsert(
                ['role' => $role],
                [
                    'id' => (string) Str::uuid(),
                    'reason' => $reason,
                    'retired_by' => $actorId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        });

        $this->memoRetired = null;
        Cache::forget('rbac.matrix');
        Cache::forget('permission.scopes');

        return true;
    }

    /** Brings a retired built-in role back and re-seeds its defaults. */
    public function restore(string $role): bool
    {
        if (! $this->isCore($role) || ! $this->isRetired($role)) {
            return false;
        }

        DB::transaction(function () use ($role) {
            DB::table('retired_roles')->where('role', $role)->delete();

            $defaults = \Database\Seeders\PermissionSeeder::defaultsFor($role);
            $rows = [];

            foreach (array_values(array_unique($defaults)) as $permission) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'role' => $role,
                    'permission' => $permission,
                    'state' => 'granted',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($rows !== []) {
                DB::table('role_permissions')->insert($rows);
            }
        });

        $this->memoRetired = null;
        Cache::forget('rbac.matrix');
        Cache::forget('permission.scopes');

        return true;
    }

    public function label(string $role): string
    {
        $canonical = AppRole::tryFrom($role);

        if ($canonical !== null) {
            return $canonical->label();
        }

        $name = DB::table('custom_roles')->where('slug', $role)->value('name');

        return is_string($name) && $name !== '' ? $name : Str::headline($role);
    }

    public function holderCount(string $role): int
    {
        return DB::table('user_roles')->where('role', $role)->count();
    }

    public function create(string $name, ?string $slug, ?string $description, array $permissions, ?string $actorId): string
    {
        $slug = self::normalizeSlug($slug !== null && trim($slug) !== '' ? $slug : $name);

        $this->guardSlug($slug);

        DB::transaction(function () use ($slug, $name, $description, $permissions, $actorId) {
            DB::table('custom_roles')->insert([
                'id' => (string) Str::uuid(),
                'slug' => $slug,
                'name' => $name,
                'description' => $description,
                'created_by' => $actorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $rows = [];

            foreach (array_values(array_unique($permissions)) as $permission) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'role' => $slug,
                    'permission' => $permission,
                    'state' => 'granted',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if ($rows !== []) {
                DB::table('role_permissions')->insert($rows);
            }
        });

        $this->memoCustom = null;
        Cache::forget('rbac.matrix');

        return $slug;
    }

    public function delete(string $slug): bool
    {
        if (! in_array($slug, $this->custom(), true)) {
            return false;
        }

        DB::transaction(function () use ($slug) {
            DB::table('role_permissions')->where('role', $slug)->delete();
            DB::table('permission_scopes')
                ->where('holder_type', 'role')
                ->where('holder_id', $slug)
                ->delete();
            DB::table('custom_roles')->where('slug', $slug)->delete();
        });

        $this->memoCustom = null;
        Cache::forget('rbac.matrix');
        Cache::forget('permission.scopes');

        return true;
    }

    /**
     * "Regional Manager!" -> "regional_manager" (lowercase snake_case,
     * first character a letter, max 40 chars — the role_permissions budget).
     */
    public static function normalizeSlug(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = (string) preg_replace('/[^a-z0-9]+/', '_', $slug);
        $slug = trim($slug, '_');
        $slug = substr($slug, 0, 40);
        $slug = rtrim($slug, '_');

        return $slug === '' ? $slug : preg_replace('/^[0-9_]+/', '', $slug);
    }

    private function guardSlug(string $slug): void
    {
        $errors = [];

        if (preg_match('/^[a-z][a-z0-9_]{2,39}$/', $slug) !== 1) {
            $errors[] = 'The slug must be 3-40 characters of lowercase letters, numbers and underscores, starting with a letter.';
        }

        if (in_array($slug, AppRole::values(), true)) {
            $errors[] = 'This slug is reserved by a built-in role.';
        } elseif (DB::table('custom_roles')->where('slug', $slug)->exists()) {
            $errors[] = 'A role with this slug already exists.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages(['slug' => $errors]);
        }
    }
}
