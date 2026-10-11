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
