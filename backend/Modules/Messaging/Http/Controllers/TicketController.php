<?php

namespace Modules\Messaging\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Messaging\Events\TicketCreated;
use Modules\Messaging\Services\MessagingService;
use Modules\Messaging\Http\Requests\CreateTicketRequest;
use Modules\Messaging\Http\Requests\ReplyTicketRequest;
use Modules\Messaging\Http\Resources\TicketResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(
        private MessagingService $messagingService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = $this->messagingService->getUserTickets(
            $request->user()->id,
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => TicketResource::collection($tickets->items()),
            'meta' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $ticket = $this->messagingService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        // Internal notes are agent-only. Strip them for the ticket owner.
        if (!$this->isStaff($request)) {
            $ticket->setRelation('messages', $ticket->messages->where('is_internal', false)->values());
        }

        return response()->json([
            'data' => new TicketResource($ticket),
        ]);
    }

    public function store(CreateTicketRequest $request): JsonResponse
    {
        $ticket = $this->messagingService->createTicket(
            $request->user()->id,
            $request->validated()
        );

        $this->messagingService->recordEvent(
            (string) $ticket->id,
            (string) $request->user()->id,
            \Modules\Messaging\Entities\TicketEvent::CREATED,
        );

        TicketCreated::dispatch($ticket);

        return response()->json([
            'message' => 'Ticket created successfully',
            'data' => new TicketResource($ticket),
        ], 201);
    }

    public function reply(ReplyTicketRequest $request, string $id): JsonResponse
    {
        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        // Only support-side roles may file internal notes.
        $data = $request->validated();
        if (!$this->isStaff($request)) {
            unset($data['is_internal']);
        }

        $message = $this->messagingService->replyToTicket(
            $id,
            $request->user()->id,
            $data
        );

        return response()->json([
            'message' => 'Reply sent successfully',
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
                'is_internal' => $message->is_internal,
            ],
        ], 201);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        $this->messagingService->closeTicket($id);
        $this->messagingService->recordEvent($id, (string) $request->user()->id, 'closed');

        return response()->json([
            'message' => 'Ticket closed successfully',
        ]);
    }

    public function assignDepartment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => 'nullable|uuid|exists:departments,id',
        ]);

        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = $request->user();
        $isStaff = $user->hasRole('super_admin') || $user->hasRole('administrator')
            || $user->hasRole('support_agent') || $user->hasRole('support_admin')
            || $user->hasRole('customer_service')
            || $user->hasPermission('support.tickets.manage');

        if (!$isStaff) {
            return response()->json(['message' => 'Only support staff can transfer tickets'], 403);
        }

        $from = $ticket->department_id;

        $ticket->update(['department_id' => $validated['department_id'] ?? null]);

        $this->messagingService->recordEvent(
            (string) $ticket->id,
            (string) $user->id,
            \Modules\Messaging\Entities\TicketEvent::DEPARTMENT_TRANSFERRED,
            ['from' => $from ?? null, 'to' => $validated['department_id'] ?? null],
        );

        return response()->json([
            'message' => 'Ticket transferred successfully',
            'data' => $ticket->fresh(),
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:open,in_progress,pending,resolved,closed',
        ]);

        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $user = $request->user();
        $isStaff = $user->hasRole('super_admin') || $user->hasRole('administrator')
            || $user->hasRole('support_agent') || $user->hasRole('support_admin')
            || $user->hasRole('customer_service')
            || $user->hasPermission('support.tickets.manage');

        if ((string) $ticket->user_id !== (string) $user->id && !$isStaff) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        // Owners may only reopen or close their own tickets.
        if (!$isStaff && !in_array($validated['status'], ['closed', 'open'], true)) {
            return response()->json(['message' => 'You may only reopen or close your own ticket'], 403);
        }

        $from = $ticket->status;

        $ticket->update(['status' => $validated['status']]);

        $this->messagingService->recordEvent(
            (string) $ticket->id,
            (string) $user->id,
            \Modules\Messaging\Entities\TicketEvent::STATUS_CHANGED,
            ['from' => $from, 'to' => $validated['status']],
        );

        return response()->json([
            'message' => 'Status updated',
            'data' => $ticket->fresh(),
        ]);
    }

    /**
     * §23 Escalation — support-side agents may escalate; priority jumps to
     * urgent, stamped + audited.
     */
    public function escalate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccess($request, $ticket) || !$this->isStaff($request)) {
            return response()->json(['message' => 'Only support staff can escalate tickets'], 403);
        }

        try {
            $ticket = $this->messagingService->escalate(
                $id,
                (string) $request->user()->id,
                $validated['reason'] ?? null,
            );
        } catch (\Core\Exceptions\NotFoundException) {
            return response()->json(['message' => 'Ticket not found'], 404);
        } catch (\Core\Exceptions\ValidationException | \Core\Exceptions\ConflictException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Ticket escalated',
            'data' => [
                'id' => $ticket->id,
                'priority' => $ticket->priority,
                'status' => $ticket->status,
                'escalated_at' => $ticket->escalated_at,
            ],
        ]);
    }

    /**
     * §23 Post-resolution satisfaction rating (owner only).
     */
    public function satisfaction(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if ((string) $ticket->user_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the ticket owner can rate it'], 403);
        }

        try {
            $ticket = $this->messagingService->rateSatisfaction(
                $id,
                (string) $request->user()->id,
                (int) $validated['rating'],
                $validated['comment'] ?? null,
            );
        } catch (\Core\Exceptions\NotFoundException) {
            return response()->json(['message' => 'Ticket not found'], 404);
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Core\Exceptions\ConflictException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        return response()->json([
            'message' => 'Thank you for your feedback',
            'data' => [
                'id' => $ticket->id,
                'satisfaction_rating' => $ticket->satisfaction_rating,
                'satisfaction_comment' => $ticket->satisfaction_comment,
            ],
        ]);
    }

    /**
     * Complete audit history (staff + ticket owner).
     */
    public function events(Request $request, string $id): JsonResponse
    {
        $ticket = \Modules\Messaging\Entities\Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccess($request, $ticket)) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        $events = \Modules\Messaging\Entities\TicketEvent::where('ticket_id', $id)
            ->orderBy('created_at')
            ->get();

        return response()->json(['data' => $events]);
    }

    private function isStaff(Request $request): bool
    {
        $roles = $request->user()?->roles->pluck('role');

        return $roles?->contains('super_admin')
            || $roles?->contains('administrator')
            || $roles?->contains('support_agent')
            || $roles?->contains('support_admin')
            || $roles?->contains('customer_service')
            || $request->user()?->hasPermission('support.tickets.manage');
    }

    private function canAccess(Request $request, object $ticket): bool
    {
        return (string) $ticket->user_id === (string) $request->user()->id
            || $this->isStaff($request);
    }
}
