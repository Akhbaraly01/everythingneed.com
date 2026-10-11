<?php

namespace Modules\Orders\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\OrderQueryInterface;
use Illuminate\Support\Facades\DB;

class OrderQueryService extends BaseService implements OrderQueryInterface
{
    public function __construct(private AuditServiceInterface $audit)
    {
    }

    public function paginate(array $filters = []): array
    {
        $query = DB::table('vendor_orders as o')
            ->leftJoin('users as u', 'u.id', '=', 'o.customer_id')
            ->leftJoin('vendors as v', 'v.id', '=', 'o.vendor_id')
            ->whereNull('o.deleted_at')
            ->select([
                'o.id', 'o.order_number', 'o.status', 'o.total_price',
                'o.created_at', 'u.name as customer_name', 'v.store_name as vendor_name',
            ]);

        // W1.6 row scoping (OWN/VENDOR/DOMAIN) — resolved server-side.
        if (($scope = $filters['scope_context'] ?? null) instanceof \Core\DTOs\ScopeContext) {
            \Core\Services\ScopeFilter::apply($query, $scope, 'o.customer_id', 'o.vendor_id');
        }

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('o.order_number', 'like', $term)
                ->orWhere('u.name', 'like', $term));
        }

        if (! empty($filters['status'])) {
            $query->where('o.status', $filters['status']);
        }

        if (! empty($filters['vendor_id'])) {
            $query->where('o.vendor_id', $filters['vendor_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('o.created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('o.created_at', '<=', $filters['date_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $page    = (int) ($filters['page'] ?? 1);
        $total   = (clone $query)->count();
        $orders  = $query->orderByDesc('o.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return [
            'data' => $orders,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ];
    }

    public function find(string $id, ?\Core\DTOs\ScopeContext $scope = null): ?object
    {
        $query = DB::table('vendor_orders as o')
            ->leftJoin('users as u', 'u.id', '=', 'o.customer_id')
            ->leftJoin('vendors as v', 'v.id', '=', 'o.vendor_id')
            ->where('o.id', $id)
            ->whereNull('o.deleted_at')
            ->select(['o.*', 'u.name as customer_name', 'u.email as customer_email', 'v.store_name as vendor_name']);

        if ($scope !== null) {
            \Core\Services\ScopeFilter::apply($query, $scope, 'o.customer_id', 'o.vendor_id');
        }

        return $query->first();
    }

    /**
     * @return string ok | missing | invalid_transition
     */
    public function updateStatus(string $id, string $status, ?string $reason = null, ?\Core\DTOs\ScopeContext $scope = null): string
    {
        $row = DB::table('vendor_orders')
            ->where('id', $id)
            ->whereNull('deleted_at');

        if ($scope !== null) {
            \Core\Services\ScopeFilter::apply($row, $scope, 'customer_id', 'vendor_id');
        }

        $order = (clone $row)->first();

        if (! $order) {
            return 'missing';
        }

        if ($order->status === $status) {
            return 'ok';
        }

        if (! \Modules\Orders\Support\OrderStateMachine::canTransition($order->status, $status)) {
            return 'invalid_transition';
        }

        $affected = (clone $row)->update(['status' => $status, 'updated_at' => now()]);

        if (! $affected) {
            return 'missing';
        }

        $this->logAudit($id, "Status updated to {$status}" . (! empty($reason) ? ": {$reason}" : ''));

        return 'ok';
    }

    public function refund(string $id, ?string $reason = null, ?\Core\DTOs\ScopeContext $scope = null): string
    {
        $row = DB::table('vendor_orders')
            ->where('id', $id)
            ->whereNull('deleted_at');

        if ($scope !== null) {
            \Core\Services\ScopeFilter::apply($row, $scope, 'customer_id', 'vendor_id');
        }

        $order = (clone $row)->first();

        if (! $order) {
            return 'missing';
        }

        if ($order->status === 'refunded') {
            return 'already_refunded';
        }

        if (! \Modules\Orders\Support\OrderStateMachine::refundable($order->status)) {
            return 'not_refundable';
        }

        (clone $row)->update(['status' => 'refunded', 'updated_at' => now()]);

        $this->logAudit($id, 'Refund issued' . (! empty($reason) ? ": {$reason}" : ''));

        return 'ok';
    }

    private function logAudit(string $orderId, string $details): void
    {
        try {
            $this->audit->log([
                'action'       => 'update',
                'entity_type'  => 'order',
                'entity_id'    => $orderId,
                'performed_by' => auth()->id(),
                'new_values'   => ['details' => $details],
            ]);
        } catch (\Throwable) {
        }
    }
}
