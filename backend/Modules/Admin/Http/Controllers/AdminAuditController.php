<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * AdminAuditController — paginated audit log access + CSV export.
 *
 * List/export are gated `can:viewAuditLogs` (super, security_admin, auditor);
 * the export additionally requires `audit.logs.export`, so a per-user grant of
 * the permission alone can never reach the data without the view policy.
 */
class AdminAuditController extends Controller
{
    /**
     * Base action vocabulary. Emitted dotted actions (payment.refunded,
     * kyc.approved, auth.login, ...) are additionally accepted from whatever
     * already exists in the table — the filter must never hide a row the
     * table contains, while unknown actions stay a 422 validation error.
     */
    private const VALID_ACTIONS = [
        'create', 'update', 'delete', 'auth', 'export', 'view',
        'auth.login', 'auth.login_failed', 'auth.logout',
        'order.paid', 'payment.charged', 'payment.failed',
        'payment.refunded', 'payment.refund_failed', 'wallet.refund',
        'wallet.deposit', 'wallet.withdraw', 'wallet.transfer',
        'wallet.hold', 'wallet.release', 'wallet.capture',
        'payout.paid', 'kyc.submitted', 'kyc.approved', 'kyc.rejected',
        'review.deleted', 'booking_transition',
    ];

    /** Export row cap — the console is an operational view, not an archive. */
    private const EXPORT_LIMIT = 10000;

    public function __construct(private AuditServiceInterface $audit) {}

    /**
     * Paginated, filterable audit log.
     *
     * GET /api/admin/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json($this->audit->paginate($this->filters($request, true)));
    }

    /**
     * Distinct actions present in the trail + the base vocabulary, so the
     * console dropdown can offer every filterable value.
     *
     * GET /api/admin/audit-logs/actions
     */
    public function actions(): JsonResponse
    {
        $emitted = \App\Models\AuditLog::query()->distinct()->orderBy('action')->pluck('action')
            ->filter(fn ($action) => is_string($action) && $action !== '')
            ->values()
            ->all();

        return response()->json([
            'data' => array_values(array_unique(array_merge(self::VALID_ACTIONS, $emitted))),
        ]);
    }

    /**
     * CSV export of the (optionally filtered) audit trail.
     *
     * GET /api/admin/audit-logs/export
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request, false);

        $result = $this->audit->paginate([
            ...$filters,
            'page'     => 1,
            'per_page' => self::EXPORT_LIMIT,
        ]);

        $rows = $result['data'];

        // The export itself is an auditable event (action = 'export').
        try {
            $this->audit->log([
                'action'       => 'export',
                'entity_type'  => 'audit_logs',
                'entity_id'    => 'audit-logs',
                'performed_by' => $request->user()?->id,
                'new_values'   => ['rows' => count($rows), 'filters' => $filters],
            ]);
        } catch (\Throwable) {
            // Audit failures never block an export the caller is allowed to take.
        }

        $filename = 'everythingneed-audit-logs-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'created_at', 'action', 'entity_type', 'entity_id',
                'actor_name', 'actor_email', 'old_values', 'new_values',
            ]);

            foreach ($rows as $row) {
                $row = (array) $row;
                fputcsv($out, [
                    (string) ($row['created_at'] ?? ''),
                    (string) ($row['action'] ?? ''),
                    (string) ($row['entity_type'] ?? ''),
                    (string) ($row['entity_id'] ?? ''),
                    (string) ($row['performed_by_name'] ?? ''),
                    (string) ($row['performed_by_email'] ?? ''),
                    (string) ($row['old_values'] ?? ''),
                    (string) ($row['new_values'] ?? ''),
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Shared filter contract for index + export (paging only applies to index).
     *
     * @return array<string, mixed>
     */
    private function filters(Request $request, bool $withPaging): array
    {
        $allowedActions = array_values(array_unique(array_merge(
            self::VALID_ACTIONS,
            \App\Models\AuditLog::query()->distinct()->pluck('action')->filter()->all(),
        )));

        $rules = [
            'search'      => ['nullable', 'string', 'max:100'],
            'action'      => ['nullable', 'string', 'max:60', \Illuminate\Validation\Rule::in($allowedActions)],
            'entity_type' => ['nullable', 'string', 'max:60'],
            'date_from'   => ['nullable', 'date'],
            'date_to'     => ['nullable', 'date', 'after_or_equal:date_from'],
        ];

        if ($withPaging) {
            $rules['per_page'] = ['nullable', 'integer', 'min:5', 'max:100'];
            $rules['page']     = ['nullable', 'integer', 'min:1'];
        }

        return $request->validate($rules);
    }
}
