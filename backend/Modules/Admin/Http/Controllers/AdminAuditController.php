<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * AdminAuditController — Provides paginated audit log access for super admins.
 */
class AdminAuditController extends Controller
{
    private const VALID_ACTIONS = ['create', 'update', 'delete', 'auth', 'export', 'view'];

    /**
     * Paginated, filterable audit log.
     *
     * GET /api/admin/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'      => ['nullable', 'string', 'max:100'],
            'action'      => ['nullable', 'string', 'in:' . implode(',', self::VALID_ACTIONS)],
            'entity_type' => ['nullable', 'string', 'max:60'],
            'date_from'   => ['nullable', 'date'],
            'date_to'     => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page'    => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'        => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('audit_logs as al')
            ->leftJoin('users as u', 'u.id', '=', 'al.performed_by')
            ->select([
                'al.id', 'al.action', 'al.entity_type', 'al.entity_id',
                'al.old_values', 'al.new_values', 'al.created_at',
                'u.email as performed_by_email', 'u.name as performed_by_name',
            ]);

        if (! empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('al.new_values', 'like', $term)
                  ->orWhere('al.old_values', 'like', $term)
                  ->orWhere('u.email', 'like', $term)
                  ->orWhere('al.entity_id', 'like', $term);
            });
        }

        if (! empty($validated['action'])) {
            $query->where('al.action', $validated['action']);
        }

        if (! empty($validated['entity_type'])) {
            $query->where('al.entity_type', 'like', $validated['entity_type']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('al.created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('al.created_at', '<=', $validated['date_to']);
        }

        $perPage = (int) ($validated['per_page'] ?? 25);
        $page    = (int) ($validated['page'] ?? 1);
        $total   = $query->count();
        $logs    = $query->orderByDesc('al.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return response()->json([
            'data' => $logs,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ]);
    }
}
