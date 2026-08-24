<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminRbacController extends Controller
{
    public const ROLES = [
        'super_admin', 'administrator', 'vendor_admin', 'moderator',
        'support_staff', 'content_manager', 'finance_admin',
        'healthcare_admin', 'learning_admin', 'customer_service',
        'category_admin', 'user',
    ];

    public function roles(): JsonResponse
    {
        $roles = DB::table('user_roles')
            ->select('role', DB::raw('count(*) as user_count'))
            ->groupBy('role')
            ->orderByDesc('user_count')
            ->get();

        // Ensure every canonical role appears even with zero users
        $byRole = collect($roles)->keyBy('role');
        $data = collect(self::ROLES)->map(fn ($role) => [
            'role' => $role,
            'user_count' => (int) ($byRole[$role]->user_count ?? 0),
        ])->values();

        return response()->json(['data' => $data]);
    }

    public function permissions(): JsonResponse
    {
        $permissions = [
            'products' => ['view', 'create', 'update', 'delete', 'approve', 'moderate'],
            'orders' => ['view', 'manage', 'refund', 'cancel'],
            'users' => ['view', 'create', 'update', 'delete', 'suspend', 'ban'],
            'vendors' => ['view', 'approve', 'suspend', 'manage_commissions'],
            'healthcare' => ['view', 'manage_doctors', 'manage_appointments', 'view_records'],
            'learn' => ['view', 'create_course', 'manage_enrollments', 'issue_certificates'],
            'hotels' => ['view', 'manage', 'approve', 'manage_reservations'],
            'food' => ['view', 'manage_restaurants', 'manage_orders'],
            'jobs' => ['view', 'post', 'manage_applications', 'shortlist'],
            'real_estate' => ['view', 'create_listing', 'manage_viewings'],
            'rides' => ['view', 'manage_drivers', 'manage_disputes'],
            'settings' => ['view', 'update_system', 'manage_features'],
            'analytics' => ['view', 'export'],
            'audit' => ['view', 'export'],
            'support' => ['view', 'manage_tickets', 'assign', 'escalate'],
            'cms' => ['view', 'create_page', 'publish', 'manage_banners'],
            'finance' => ['view', 'manage_payments', 'process_refunds', 'manage_payouts'],
        ];

        return response()->json(['data' => $permissions]);
    }

    /**
     * Effective role → permission matrix from the database.
     */
    public function matrix(): JsonResponse
    {
        $rows = DB::table('role_permissions')
            ->select('role', 'permission')
            ->orderBy('role')
            ->orderBy('permission')
            ->get()
            ->groupBy('role');

        $data = collect(self::ROLES)->map(fn ($role) => [
            'role' => $role,
            'permissions' => $rows->has($role)
                ? $rows[$role]->pluck('permission')->values()->all()
                : [],
        ])->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Grant a single granular permission to a role.
     */
    public function grant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'permission' => ['required', 'string', Rule::in(\Database\Seeders\PermissionSeeder::CATALOG)],
        ]);

        DB::table('role_permissions')->updateOrInsert(
            ['role' => $validated['role'], 'permission' => $validated['permission']],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        return response()->json(['message' => "Granted {$validated['permission']} to {$validated['role']}"]);
    }

    /**
     * Revoke a single granular permission from a role.
     */
    public function revoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(self::ROLES)],
            'permission' => ['required', 'string'],
        ]);

        DB::table('role_permissions')
            ->where('role', $validated['role'])
            ->where('permission', $validated['permission'])
            ->delete();

        \Illuminate\Support\Facades\Cache::forget('rbac.matrix');

        return response()->json(['message' => "Revoked {$validated['permission']} from {$validated['role']}"]);
    }

    public function updateRole(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'role' => ['required', 'string', Rule::in(self::ROLES)],
        ]);

        DB::transaction(function () use ($request) {
            DB::table('user_roles')->where('user_id', $request->user_id)->delete();
            DB::table('user_roles')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'user_id' => $request->user_id,
                'role' => $request->role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Role updated']);
    }
}
