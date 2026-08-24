<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Enums\AppRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

/**
 * AdminUserController
 *
 * Handles user management for the admin control center.
 * All routes require auth:sanctum + manageUsers gate.
 */
class AdminUserController extends Controller
{
    /**
     * Paginated list of users with optional search and role filter.
     *
     * GET /api/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'role'     => ['nullable', 'string', Rule::in(AppRole::values())],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('users as u')
            ->leftJoin('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->leftJoin('profiles as up', 'up.user_id', '=', 'u.id')
            ->whereNull('u.deleted_at')
            ->select([
                'u.id', 'u.name', 'u.email', 'u.created_at',
                'u.suspended_at', 'u.email_verified_at',
                'ur.role',
            ]);

        if (! empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('u.name', 'like', $term)
                  ->orWhere('u.email', 'like', $term);
            });
        }

        if (! empty($validated['role'])) {
            $query->where('ur.role', $validated['role']);
        }

        $perPage  = (int) ($validated['per_page'] ?? 20);
        $page     = (int) ($validated['page'] ?? 1);
        $total    = $query->count();
        $users    = $query->orderByDesc('u.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn ($u) => [
                ...(array) $u,
                'status' => $u->suspended_at ? 'suspended' : ($u->email_verified_at ? 'active' : 'unverified'),
            ]);

        return response()->json([
            'data'  => $users,
            'meta'  => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ]);
    }

    /**
     * Returns full user detail.
     *
     * GET /api/admin/users/{id}
     */
    public function show(string $id): JsonResponse
    {
        $user = DB::table('users as u')
            ->leftJoin('user_roles as ur', 'ur.user_id', '=', 'u.id')
            ->leftJoin('profiles as up', 'up.user_id', '=', 'u.id')
            ->where('u.id', $id)
            ->whereNull('u.deleted_at')
            ->select(['u.*', 'ur.role', 'up.phone', 'up.avatar_url'])
            ->first();

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['data' => $user]);
    }

    /**
     * Updates a user's role.
     *
     * PUT /api/admin/users/{id}/role
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(AppRole::values())],
        ]);

        $user = DB::table('users')->where('id', $id)->whereNull('deleted_at')->first();
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $id],
            ['role' => $validated['role'], 'updated_at' => now()]
        );

        $this->logAudit('update', 'user', $id, "Changed role to {$validated['role']}");

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * Suspends a user account.
     *
     * POST /api/admin/users/{id}/suspend
     */
    public function suspend(string $id): JsonResponse
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['suspended_at' => now()]);

        if (! $affected) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $this->logAudit('update', 'user', $id, 'User suspended');

        return response()->json(['message' => 'User suspended']);
    }

    /**
     * Restores a suspended user account.
     *
     * POST /api/admin/users/{id}/restore
     */
    public function restore(string $id): JsonResponse
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['suspended_at' => null]);

        if (! $affected) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $this->logAudit('update', 'user', $id, 'User restored');

        return response()->json(['message' => 'User restored']);
    }

    /**
     * Soft-deletes a user.
     *
     * DELETE /api/admin/users/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $affected = DB::table('users')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now()]);

        if (! $affected) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $this->logAudit('delete', 'user', $id, 'User soft-deleted');

        return response()->json(['message' => 'User deleted']);
    }

    /**
     * Writes an audit log entry.
     */
    private function logAudit(string $action, string $entityType, string $entityId, string $details): void
    {
        try {
            DB::table('audit_logs')->insert([
                'id'          => \Illuminate\Support\Str::uuid()->toString(),
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'new_values'  => json_encode(['details' => $details]),
                'performed_by' => auth()->id(),
                'created_at'  => now(),
            ]);
        } catch (Throwable) {
            // Audit log failures must not break the response
        }
    }
}
