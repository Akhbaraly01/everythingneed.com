<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Enums\AppRole;
use Core\Services\Contracts\RoleAssignmentInterface;
use Core\Services\Contracts\UserAdminInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Modules\Admin\Http\Requests\AdminStoreUserRequest;
use Modules\Admin\Http\Requests\AdminUpdateRoleRequest;

/**
 * AdminUserController
 *
 * Handles user management for the admin control center.
 * All routes require auth:sanctum + manageUsers gate.
 */
class AdminUserController extends Controller
{
    public function __construct(
        private UserAdminInterface $users,
        private RoleAssignmentInterface $assignments,
    ) {}

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

        return response()->json($this->users->paginate($validated));
    }

    /**
     * Returns full user detail.
     *
     * GET /api/admin/users/{id}
     */
    public function show(string $id): JsonResponse
    {
        $user = $this->users->find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['data' => $user]);
    }

    /**
     * Creates a user and assigns their initial role through the single
     * guarded write path. Escalation guards run BEFORE any row exists,
     * so a rejected request leaves nothing behind.
     *
     * POST /api/admin/users
     */
    public function store(AdminStoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if ($this->users->emailExists($validated['email'])) {
            return response()->json(['message' => 'A user with this email already exists.'], 422);
        }

        $userId = (string) Str::uuid();

        // Guards first: unknown role, self-assignment, non-admin actor,
        // super-only grant rules - all checked before any row exists, so a
        // rejected request leaves nothing behind.
        $this->assignments->assertAssignable($request->user(), $userId, $validated['role']);

        $this->users->create($validated + ['id' => $userId]);

        // Single guarded write path for the initial role grant.
        $this->assignments->assign($request->user(), $userId, $validated['role']);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $this->users->find($userId),
        ], 201);
    }

    /**
     * Updates a user's role.
     *
     * PUT /api/admin/users/{id}/role
     */
    public function updateRole(AdminUpdateRoleRequest $request, string $id): JsonResponse
    {
        $validated = $request->validated();

        // Escalation guards + single guarded write path live in the service.
        if (! $this->assignments->assign($request->user(), $id, $validated['role'])) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'Role updated successfully']);
    }

    /**
     * Updates a user's profile (name / email). Role changes have their own
     * endpoint; suspension has its own switch.
     *
     * PUT /api/admin/users/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'min:2', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
        ]);

        if ($validated === []) {
            return response()->json(['message' => 'No changes provided.'], 422);
        }

        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = trim($validated['name']);
        }

        if (array_key_exists('email', $validated)) {
            $payload['email'] = strtolower(trim($validated['email']));
            // Console-set addresses stay usable exactly like provisioned ones.
            $payload['email_verified_at'] = now();
        }

        if (! $this->users->update($id, $payload)) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $this->users->find($id),
        ]);
    }

    /**
     * Suspends a user account (the dashboard access on/off switch).
     * Never allowed on yourself, and never on the last active super admin.
     *
     * POST /api/admin/users/{id}/suspend
     */
    public function suspend(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();

        if ($actor !== null && $actor->id === $id) {
            return response()->json(['message' => 'You cannot suspend your own account.'], 403);
        }

        // Lockout guard: the last active super admin can never be switched off.
        if ($this->users->isLastActiveSuperAdmin($id)) {
            return response()->json(['message' => 'The last active super admin cannot be suspended.'], 409);
        }

        if (! $this->users->suspend($id)) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'User suspended']);
    }

    /**
     * Restores a suspended user account.
     *
     * POST /api/admin/users/{id}/restore
     */
    public function restore(string $id): JsonResponse
    {
        if (! $this->users->restore($id)) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'User restored']);
    }

    /**
     * Soft-deletes a user. Same self/lockout guards as suspend: you can
     * never delete yourself and the last active super admin can never go.
     *
     * DELETE /api/admin/users/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $actor = $request->user();

        if ($actor !== null && $actor->id === $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        // Lockout guard: deleting the last active super admin would strand
        // the platform with no one holding the wildcard permission set.
        if ($this->users->isLastActiveSuperAdmin($id)) {
            return response()->json(['message' => 'The last active super admin cannot be deleted.'], 409);
        }

        if (! $this->users->softDelete($id)) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['message' => 'User deleted']);
    }
}
