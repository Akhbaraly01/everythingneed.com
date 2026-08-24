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
