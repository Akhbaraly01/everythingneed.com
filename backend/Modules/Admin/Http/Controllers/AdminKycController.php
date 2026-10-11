<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin KYC queue (kyc_verifications + requester). Decisions reuse the
 * existing POST /api/kyc/{id}/review endpoint (role-gated to
 * super_admin/administrator/kyc_reviewer) so there is one write path.
 */
class AdminKycController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:120'],
            'status'   => ['nullable', 'string', 'in:all,pending,submitted,approved,rejected,requires_action'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('kyc_verifications as k')
            ->leftJoin('users as u', 'u.id', '=', 'k.user_id')
            ->select([
                'k.id', 'k.status', 'k.document_type', 'k.document_number',
                'k.full_name', 'k.nationality', 'k.attempts', 'k.verified_at',
                'k.rejection_reason', 'k.submitted_at', 'k.reviewed_at', 'k.created_at',
                'u.name as user_name', 'u.email as user_email',
            ])
            ->whereNull('k.deleted_at')
            ->orderByDesc('k.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('u.name', 'ilike', "%{$search}%")
                    ->orWhere('u.email', 'ilike', "%{$search}%")
                    ->orWhere('k.document_number', 'ilike', "%{$search}%");
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== '' && $status !== 'all') {
            $query->where('k.status', $status);
        }

        $total = (clone $query)->count();
        $page  = (int) ($validated['page'] ?? 1);
        $rows  = $query->offset(($page - 1) * 15)->limit(15)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => 15, 'total' => $total],
        ]);
    }
}
