<?php

namespace Core\Services;

use App\Models\User;
use Core\DTOs\ScopeContext;
use Core\Enums\PermissionScope;
use Core\Services\Contracts\ScopeResolverInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ScopeResolver implements ScopeResolverInterface
{
    public function contextFor(User $user, string $permission): ScopeContext
    {
        // super_admin bypasses row scoping, mirroring hasPermission().
        if ($user->hasRole('super_admin')) {
            return ScopeContext::global($user);
        }

        $rows = $this->rows();
        $userId = (string) $user->id;

        // User-level grant beats role rows.
        foreach ($rows as $row) {
            if ($row->holder_type === 'user' && $row->holder_id === $userId && $row->permission === $permission) {
                return $this->build($row, $user);
            }
        }

        $roleValues = $user->roles()->pluck('role')->all();
        $winner = null;
        foreach ($rows as $row) {
            if ($row->holder_type === 'role' && $row->permission === $permission && in_array($row->holder_id, $roleValues, true)) {
                $scope = PermissionScope::tryFrom($row->scope);
                if ($winner === null || ($scope !== null && $scope->precedence() > PermissionScope::from($winner->scope)->precedence())) {
                    $winner = $row;
                }
            }
        }

        return $winner !== null ? $this->build($winner, $user) : ScopeContext::global($user);
    }

    public function grant(array $attributes): void
    {
        $key = [
            'holder_type' => $attributes['holder_type'],
            'holder_id' => $attributes['holder_id'],
            'permission' => $attributes['permission'],
        ];

        $exists = DB::table('permission_scopes')->where($key)->exists();

        if ($exists) {
            DB::table('permission_scopes')->where($key)->update([
                'scope' => $attributes['scope'],
                'scope_value' => $attributes['scope_value'] ?? null,
                'updated_at' => now(),
            ]);
        } else {
            DB::table('permission_scopes')->insert([
                'id' => (string) Str::uuid(),
                ...$key,
                'scope' => $attributes['scope'],
                'scope_value' => $attributes['scope_value'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Cache::forget(self::CACHE_KEY);
    }

    public function revoke(string $id): bool
    {
        $deleted = (bool) DB::table('permission_scopes')->where('id', $id)->delete();

        if ($deleted) {
            Cache::forget(self::CACHE_KEY);
        }

        return $deleted;
    }

    public function all(): array
    {
        return DB::table('permission_scopes')
            ->orderBy('holder_type')
            ->orderBy('holder_id')
            ->orderBy('permission')
            ->get()
            ->all();
    }

    private const CACHE_KEY = 'permission.scopes';

    /** @return list<object> */
    private function rows(): array
    {
        return Cache::remember(self::CACHE_KEY, 300, function () {
            return DB::table('permission_scopes')->get()->all();
        });
    }

    private function build(object $row, User $user): ScopeContext
    {
        $scope = PermissionScope::tryFrom($row->scope) ?? PermissionScope::GLOBAL;

        $vendorId = null;
        if ($scope === PermissionScope::VENDOR) {
            $vendorId = DB::table('vendors')
                ->where('user_id', $user->id)
                ->value('id');
        }

        return new ScopeContext(
            scope: $scope,
            userId: (string) $user->id,
            value: $row->scope_value ?? null,
            vendorId: $vendorId !== null ? (string) $vendorId : null,
        );
    }
}
