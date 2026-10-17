<?php

namespace Core\Services;

use App\Models\User;
use Core\Enums\AppRole;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\UserAdminInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserAdminService extends BaseService implements UserAdminInterface
{
    public function __construct(private AuditServiceInterface $audit)
    {
    }

    public function paginate(array $filters = []): array
    {
        $query = DB::table('users as u')
            ->leftJoin('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->leftJoin('profiles as up', 'up.user_id', '=', 'u.id')
            ->whereNull('u.deleted_at')
            ->select([
                'u.id', 'u.name', 'u.email', 'u.created_at',
                'u.suspended_at', 'u.email_verified_at',
                'ur.role',
            ]);

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('u.name', 'like', $term)
                    ->orWhere('u.email', 'like', $term);
            });
        }

        if (! empty($filters['role'])) {
            $query->where('ur.role', $filters['role']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $page    = (int) ($filters['page'] ?? 1);
        $total   = (clone $query)->count();
        $users   = $query->orderByDesc('u.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn ($u) => [
                ...(array) $u,
                'status' => $u->suspended_at ? 'suspended' : ($u->email_verified_at ? 'active' : 'unverified'),
            ]);

        return [
            'data' => $users,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ];
    }

    public function find(string $id): ?object
    {
        return DB::table('users as u')
            ->leftJoin('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->leftJoin('profiles as up', 'up.user_id', '=', 'u.id')
            ->where('u.id', $id)
            ->whereNull('u.deleted_at')
            ->select(['u.*', 'ur.role', 'up.phone', 'up.avatar_url'])
            ->first();
    }

    // setRole() intentionally removed: role grants go through
    // Core\Services\RoleAssignmentService::assign (single guarded path).

    public function suspend(string $id): bool
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['suspended_at' => now()]);

        if (! $affected) {
            return false;
        }

        // Kill every active API session so suspension takes effect immediately.
        User::find($id)?->tokens()->delete();

        // Stateful web sessions (SESSION_DRIVER=database) die with it, so a
        // suspended console tab loses access on its very next request.
        try {
            DB::table('sessions')->where('user_id', $id)->delete();
        } catch (\Throwable) {
            // Non-database session drivers have no rows to purge here.
        }

        $this->auditLog('update', $id, 'User suspended');

        return true;
    }

    public function restore(string $id): bool
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['suspended_at' => null]);

        if (! $affected) {
            return false;
        }

        $this->auditLog('update', $id, 'User restored');

        return true;
    }

    public function update(string $id, array $data): bool
    {
        $exists = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->exists();

        if (! $exists) {
            return false;
        }

        DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update($data + ['updated_at' => now()]);

        $this->auditLog('update', $id, 'User profile updated: ' . implode(', ', array_keys($data)));

        return true;
    }

    public function softDelete(string $id): bool
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now()]);

        if (! $affected) {
            return false;
        }

        $this->auditLog('delete', $id, 'User soft-deleted');

        return true;
    }

    public function emailExists(string $email): bool
    {
        return DB::table('users')
            ->where('email', $email)
            ->whereNull('deleted_at')
            ->exists();
    }

    public function create(array $data): string
    {
        $userId = $data['id'] ?? (string) Str::uuid();

        DB::table('users')->insert([
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            // Admin-provisioned accounts are ready to use immediately.
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->auditLog('create', $userId, 'User provisioned from the console');

        return $userId;
    }

    public function isLastActiveSuperAdmin(string $targetId): bool
    {
        $targetIsSuper = DB::table('user_roles')
            ->where('user_id', $targetId)
            ->where('role', AppRole::SUPER_ADMIN)
            ->exists();

        if (! $targetIsSuper) {
            return false;
        }

        // Lockout guard: another ACTIVE super admin must remain.
        $otherActiveSupers = DB::table('user_roles')
            ->join('users', 'users.id', '=', 'user_roles.user_id')
            ->whereNull('users.deleted_at')
            ->whereNull('users.suspended_at')
            ->where('user_roles.role', AppRole::SUPER_ADMIN)
            ->where('user_roles.user_id', '!=', $targetId)
            ->distinct()
            ->count('user_roles.user_id');

        return $otherActiveSupers < 1;
    }

    private function auditLog(string $action, string $entityId, string $details): void
    {
        try {
            $this->audit->log([
                'action'       => $action,
                'entity_type'  => 'user',
                'entity_id'    => $entityId,
                'performed_by' => auth()->id(),
                'new_values'   => ['details' => $details],
            ]);
        } catch (\Throwable) {
            // Audit log failures must not break the response.
        }
    }
}
