<?php

namespace Modules\Messaging\Listeners;

use Modules\Messaging\Events\TicketCreated;
use App\Models\User;
use App\Models\UserRole;
use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyDepartmentOfTicket implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TicketCreated $event): void
    {
        $ticket = $event->ticket;

        // Route to every active customer-service agent.
        $agentIds = UserRole::query()
            ->whereIn('role', ['customer_service', 'support_staff'])
            ->whereNull('deleted_at')
            ->pluck('user_id')
            ->unique();

        foreach ($agentIds as $agentId) {
            app(NotificationServiceInterface::class)->notify(
                (string) $agentId,
                'New support ticket',
                "#{$ticket->ticket_number} [{$ticket->priority}] {$ticket->subject}",
                'support',
                (string) $ticket->id,
            );
        }
    }
}
