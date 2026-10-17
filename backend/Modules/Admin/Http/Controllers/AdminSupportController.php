<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\SupportQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSupportController extends Controller
{
    public function __construct(
        private SupportQueryInterface $support,
        private \Core\Services\Contracts\ScopeResolverInterface $scopes,
    ) {}

    public function tickets(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:120'],
            'status'   => ['nullable', 'string', 'in:all,open,in_progress,pending,resolved,closed'],
            'priority' => ['nullable', 'string', 'in:all,low,medium,high,urgent'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $result = $this->support->supportTickets([
            'search'   => $validated['search'] ?? null,
            'status'   => $validated['status'] ?? null,
            'priority' => $validated['priority'] ?? null,
            'page'     => (int) ($validated['page'] ?? 1),
            // W1.6 row scoping — OWN = assigned to me, DOMAIN = department.
            'scope_context' => $this->scopes->contextFor($request->user(), 'support.tickets.view'),
        ]);

        return response()->json($result);
    }

    public function assign(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'assigned_to' => 'required|uuid|exists:users,id',
        ]);

        $assigned = $this->support->assignSupportTicket(
            $id,
            $request->assigned_to,
            $this->scopes->contextFor($request->user(), 'support.tickets.view'),
        );

        if (! $assigned) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        return response()->json(['message' => 'Ticket assigned successfully']);
    }

    /**
     * Assignable support staff (id/name/email only). Support roles hold
     * manageSupport but NOT the users console's manageUsers policy, so the
     * old "GET /api/admin/users?role=support_agent" picker 403ed for them.
     *
     * GET /api/admin/support/agents
     */
    public function agents(): JsonResponse
    {
        $roles = array_map(
            fn (\Core\Enums\AppRole $r) => $r->value,
            [
                \Core\Enums\AppRole::SUPER_ADMIN,
                \Core\Enums\AppRole::ADMINISTRATOR,
                \Core\Enums\AppRole::SUPPORT_AGENT,
                \Core\Enums\AppRole::CUSTOMER_SERVICE,
                \Core\Enums\AppRole::SUPPORT_ADMIN,
            ],
        );

        $agents = \App\Models\User::query()
            ->whereNull('suspended_at')
            ->whereHas('roles', fn ($q) => $q->whereIn('role', $roles))
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json(['data' => $agents]);
    }

    /** Staff ticket detail: full thread including internal notes + events. */
    public function show(Request $request, string $id): JsonResponse
    {
        $ticket = \Modules\Messaging\Entities\Ticket::with([
            'messages.sender:id,name',
            'department:id,name',
            'user:id,name,email',
        ])->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $events = \Modules\Messaging\Entities\TicketEvent::where('ticket_id', $id)
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => [
            'ticket' => $ticket,
            'events' => $events,
        ]]);
    }
}
