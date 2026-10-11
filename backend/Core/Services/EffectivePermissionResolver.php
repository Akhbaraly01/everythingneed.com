<?php

namespace Core\Services;

use App\Models\User;
use Core\Services\Contracts\EffectivePermissionResolverInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Single owner of effective-permission truth (W2).
 *
 * Replaces the triplicated logic that used to live in User::grants(),
 * HandleInertiaRequests' auth.permissions share and ad-hoc matrix reads:
 * every caller now routes through has()/all(). Only rows in the granted
 * state count; revoked rows stay in the table as denied (audit trail).
 */
class EffectivePermissionResolver extends BaseService implements EffectivePermissionResolverInterface
{
    public function has(User $user, string $permission): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        if (str_contains($permission, '.')) {
            $segments = explode('.', $permission);
            if (count($segments) === 2) {
                [$module, $action] = $segments;
                $aliases = array_values(array_filter(
                    $this->catalog(),
                    fn ($p) => str_starts_with($p, $module.'.') && str_ends_with($p, '.'.$action),
                ));
                if ($aliases !== []) {
                    foreach ($aliases as $alias) {
                        if ($this->grants($user, $alias)) {
                            return true;
                        }
                    }

                    return false;
                }
            }
        }

        return $this->grants($user, $permission);
    }

    public function all(User $user): array
    {
        if ($user->hasRole('super_admin')) {
            return ['*'];
        }

        $matrix = $this->roleMatrix();

        $rolePermissions = collect($user->roles()->pluck('role'))
            ->flatMap(fn ($role) => $matrix[$role] ?? collect());

        return $rolePermissions
            ->merge($this->userGrants($user))
            ->unique()
            ->values()
            ->all();
    }

    private function grants(User $user, string $permission): bool
    {
        $matrix = $this->roleMatrix();

        if ($user->roles()->get(['role'])->contains(
            fn ($r) => ($matrix[$r->role] ?? collect())->contains($permission),
        )) {
            return true;
        }

        // Per-user grants layer on top of the role matrix (consulted only
        // when the role check fails - the common case never pays for it).
        return $this->userGrants($user)->contains($permission);
    }

    private function catalog(): array
    {
        return Cache::remember('rbac.catalog', 300, function () {
            return \Database\Seeders\PermissionSeeder::CATALOG;
        });
    }

    /**
     * role => granted permission collection (same shape the old
     * User::grants() consumed; denied rows excluded at the query).
     */
    private function roleMatrix(): \Illuminate\Support\Collection
    {
        return Cache::remember('rbac.matrix', 300, function () {
            return DB::table('role_permissions')
                ->where('state', 'granted')
                ->get()
                ->groupBy('role')
                ->map->pluck('permission');
        });
    }

    private function userGrants(User $user): \Illuminate\Support\Collection
    {
        return Cache::remember("user.permissions.{$user->id}", 300, function () use ($user) {
            return DB::table('user_permissions')
                ->where('user_id', $user->id)
                ->where('state', 'granted')
                ->pluck('permission');
        });
    }
}
