<?php

namespace Modules\Vendors\Services;

use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\VendorQueryInterface;
use Core\Services\BaseService;
use Illuminate\Support\Facades\DB;

class VendorQueryService extends BaseService implements VendorQueryInterface
{
    public function __construct(private AuditServiceInterface $audit)
    {
    }

    public function paginate(array $filters = []): array
    {
        $query = DB::table('vendors as v')
            ->leftJoin('users as u', 'u.id', '=', 'v.user_id')
            ->whereNull('v.deleted_at')
            ->select([
                'v.id', 'v.store_name', 'v.category', 'v.is_verified', 'v.created_at',
                'u.name as user_name', 'u.email as user_email',
                DB::raw('(SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) as total_products'),
                DB::raw('(SELECT COUNT(*) FROM vendor_orders o WHERE o.vendor_id = v.id) as total_orders'),
                DB::raw('(SELECT COALESCE(SUM(o.total_price), 0) FROM vendor_orders o WHERE o.vendor_id = v.id) as revenue'),
            ]);

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('v.store_name', 'like', $term)->orWhere('v.category', 'like', $term));
        }

        // Honest states only: a vendor is verified or awaiting approval.
        // "Suspend" flips is_verified to false (SuspendVendor action), so a
        // suspended vendor is simply not verified - there is no third state.
        $status = $filters['status'] ?? 'all';
        match ($status) {
            'pending'  => $query->where('v.is_verified', false),
            'verified' => $query->where('v.is_verified', true),
            default    => null,
        };

        $perPage = (int) ($filters['per_page'] ?? 20);
        $page    = (int) ($filters['page'] ?? 1);
        $total   = (clone $query)->count();
        $vendors = $query->orderByDesc('v.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn ($v) => [
                ...(array) $v,
                'status' => $v->is_verified ? 'verified' : 'pending',
            ]);

        return [
            'data' => $vendors,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ];
    }

    public function find(string $id): ?object
    {
        return DB::table('vendors')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();
    }

    public function setVerified(string $id, bool $verified, string $action = 'update', ?string $details = null): bool
    {
        $affected = DB::table('vendors')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(['is_verified' => $verified, 'updated_at' => now()]);

        if (! $affected) {
            return false;
        }

        try {
            $this->audit->log([
                'action'       => $action,
                'entity_type'  => 'vendor',
                'entity_id'    => $id,
                'performed_by' => auth()->id(),
                'new_values'   => $details !== null
                    ? ['details' => $details]
                    : ['is_verified' => $verified],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break responses.
        }

        return true;
    }

    public function withdrawals(array $filters = []): array
    {
        $query = DB::table('vendor_withdrawals as w')
            ->leftJoin('vendors as v', 'v.id', '=', 'w.vendor_id')
            ->select('w.*', 'v.store_name as vendor_name')
            ->orderByDesc('w.created_at');

        if (isset($filters['status'])) {
            $query->where('w.status', $filters['status']);
        }

        $total = (clone $query)->count();
        $page  = (int) ($filters['page'] ?? 1);
        $rows  = $query->offset(($page - 1) * 15)->limit(15)->get();

        return ['data' => $rows, 'total' => $total];
    }

    public function findWithdrawal(string $id): ?object
    {
        return DB::table('vendor_withdrawals')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();
    }

    public function markWithdrawalPaid(string $id): void
    {
        DB::table('vendor_withdrawals')->where('id', $id)->update([
            'status'       => 'paid',
            'processed_at' => now(),
            'updated_at'   => now(),
        ]);

        try {
            $this->audit->log([
                'action'       => 'payout.paid',
                'entity_type'  => 'vendor_withdrawal',
                'entity_id'    => $id,
                'performed_by' => auth()->id(),
                'old_values'   => ['status' => 'pending'],
                'new_values'   => ['status' => 'paid'],
            ]);
        } catch (\Throwable) {
        }
    }

    public function recordCommission(string $vendorId, string $orderId, float $totalPrice): void
    {
        DB::table('vendor_commissions')->updateOrInsert(
            ['vendor_id' => $vendorId, 'order_id' => $orderId],
            [
                'id'         => (string) \Illuminate\Support\Str::uuid(),
                'amount'     => round($totalPrice * 0.90, 2), // vendor share after 10% platform fee
                'rate'       => 0.10,
                'status'     => 'cleared',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }
}
