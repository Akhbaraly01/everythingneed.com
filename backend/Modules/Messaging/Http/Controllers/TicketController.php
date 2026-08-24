<?php

namespace Modules\Messaging\Http\Controllers;

use App\Http\Controllers\Controller;
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

    public function show(string $id): JsonResponse
    {
        $ticket = $this->messagingService->getTicket($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
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

        return response()->json([
            'message' => 'Ticket created successfully',
            'data' => new TicketResource($ticket),
        ], 201);
    }

    public function reply(ReplyTicketRequest $request, string $id): JsonResponse
    {
        $message = $this->messagingService->replyToTicket(
            $id,
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Reply sent successfully',
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
            ],
        ], 201);
    }

    public function close(string $id): JsonResponse
    {
        $this->messagingService->closeTicket($id);

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
            || $user->hasRole('support_staff') || $user->hasRole('customer_service');

        if (!$isStaff) {
            return response()->json(['message' => 'Only support staff can transfer tickets'], 403);
        }

        $ticket->update(['department_id' => $validated['department_id'] ?? null]);

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
            || $user->hasRole('support_staff') || $user->hasRole('customer_service');

        if ((string) $ticket->user_id !== (string) $user->id && !$isStaff) {
            return response()->json(['message' => 'You do not have access to this ticket'], 403);
        }

        // Owners may only reopen or close their own tickets.
        if (!$isStaff && !in_array($validated['status'], ['closed', 'open'], true)) {
            return response()->json(['message' => 'You may only reopen or close your own ticket'], 403);
        }

        $ticket->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Status updated',
            'data' => $ticket->fresh(),
        ]);
    }
}
