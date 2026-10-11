<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Messaging\Services\MessagingService;

/**
 * Guest suspension appeals (plan Q).
 *
 * Heavily throttled and generic-response: never discloses whether the
 * email belongs to an account. Creates a real support ticket only for a
 * currently-suspended account so the queue stays actionable.
 */
class AppealController extends Controller
{
    public function store(Request $request, MessagingService $messaging): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user && $user->suspended_at) {
            $ticket = $messaging->createTicket($user->id, [
                'subject' => 'Suspension appeal',
                'message' => $validated['message'],
                'priority' => \Modules\Messaging\Entities\Ticket::PRIORITY_HIGH,
            ]);
            $messaging->recordEvent((string) $ticket->id, (string) $user->id, \Modules\Messaging\Entities\TicketEvent::CREATED);

            try {
                app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                    'action' => 'auth.appeal.submitted',
                    'entity_type' => 'auth',
                    'entity_id' => (string) $user->id,
                    'performed_by' => (string) $user->id,
                ]);
            } catch (\Throwable) {
                // Audit must never break the appeal flow.
            }
        }

        return response()->json([
            'message' => 'If the account exists and is suspended, your appeal was received. Our team will review it.',
        ]);
    }
}
