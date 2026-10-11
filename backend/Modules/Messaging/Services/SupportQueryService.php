<?php

namespace Modules\Messaging\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\SupportQueryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupportQueryService extends BaseService implements SupportQueryInterface
{
    public function departments(): array
    {
        return DB::table('departments')
            ->leftJoin('tickets', 'tickets.department_id', '=', 'departments.id')
            ->select(
                'departments.id',
                'departments.name',
                'departments.description',
                'departments.created_at',
                DB::raw('count(tickets.id) as tickets_count'),
            )
            ->groupBy('departments.id')
            ->orderBy('departments.name')
            ->get()
            ->all();
    }

    public function createDepartment(array $data): string
    {
        $id = (string) Str::uuid();

        DB::table('departments')->insert([
            'id'          => $id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return $id;
    }

    public function updateDepartment(string $id, array $data): bool
    {
        $exists = DB::table('departments')->where('id', $id)->whereNull('deleted_at')->exists();

        if (! $exists) {
            return false;
        }

        DB::table('departments')
            ->where('id', $id)
            ->update(array_merge($data, ['updated_at' => now()]));

        return true;
    }

    public function departmentInUse(string $id): bool
    {
        return DB::table('tickets')->where('department_id', $id)->exists();
    }

    public function deleteDepartment(string $id): bool
    {
        return (bool) DB::table('departments')->where('id', $id)->delete();
    }

    /**
     * Admin support desk: the LIVE tickets queue (same table the dashboard
     * counts and the messaging TicketController serves). The legacy
     * support_tickets table is retired for reads (kept for history only).
     */
    public function supportTickets(array $filters = []): array
    {
        $query = DB::table('tickets as t')
            ->leftJoin('users as requester', 'requester.id', '=', 't.user_id')
            ->leftJoin('users as assignee', 'assignee.id', '=', 't.assigned_to')
            ->leftJoin('departments as d', 'd.id', '=', 't.department_id')
            ->select([
                't.id', 't.ticket_number', 't.subject', 't.status', 't.priority',
                't.assigned_to', 't.department_id', 't.created_at', 't.updated_at',
                'requester.name as user_name',
                'assignee.name as assigned_to_name',
                'd.name as department_name',
            ])
            ->orderByDesc('t.created_at');

        // W1.6 row scoping — OWN = assigned to me, DOMAIN = department.
        if (($scope = $filters['scope_context'] ?? null) instanceof \Core\DTOs\ScopeContext) {
            \Core\Services\ScopeFilter::apply($query, $scope, 't.assigned_to', '', 't.department_id');
        }

        if (is_string($filters['search'] ?? null) && $filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('t.ticket_number', 'ilike', "%{$search}%")
                    ->orWhere('t.subject', 'ilike', "%{$search}%")
                    ->orWhere('requester.name', 'ilike', "%{$search}%");
            });
        }

        if (is_string($filters['status'] ?? null) && $filters['status'] !== '' && $filters['status'] !== 'all') {
            $query->where('t.status', $filters['status']);
        }

        if (is_string($filters['priority'] ?? null) && $filters['priority'] !== '' && $filters['priority'] !== 'all') {
            $query->where('t.priority', $filters['priority']);
        }

        $total   = (clone $query)->count();
        $page    = (int) ($filters['page'] ?? 1);
        $tickets = $query->offset(($page - 1) * 15)->limit(15)->get();

        return ['data' => $tickets, 'total' => $total];
    }

    /**
     * Assign a live ticket to a user (staff-only endpoint). Assignment does
     * not touch status - staff move status explicitly through the desk.
     * Returns false when the ticket is missing or outside the caller's scope.
     */
    public function assignSupportTicket(string $id, string $assignee, ?\Core\DTOs\ScopeContext $scope = null): bool
    {
        $row = DB::table('tickets')->where('id', $id);

        if ($scope !== null) {
            \Core\Services\ScopeFilter::apply($row, $scope, 'assigned_to', '', 'department_id');
        }

        $affected = (clone $row)->update([
            'assigned_to' => $assignee,
            'updated_at'  => now(),
        ]);

        return $affected > 0;
    }
}
