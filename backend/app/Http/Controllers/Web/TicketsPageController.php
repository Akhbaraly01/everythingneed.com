<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Messaging\Entities\Ticket;
use Modules\Messaging\Entities\TicketMessage;

class TicketsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $tickets = Ticket::where('user_id', $request->user()->id)
            ->with('department:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('tickets/Index', [
            'tickets' => $tickets,
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $ticket = Ticket::with(['messages.sender:id,name', 'department:id,name'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return Inertia::render('tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('tickets/Create');
    }
}
