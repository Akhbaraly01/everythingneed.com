<?php

namespace Modules\Messaging\Listeners;

use Modules\Messaging\Events\TicketReplied;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyUserOfReply implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TicketReplied $event): void
    {
        $message = $event->message;
        $ticket = \Modules\Messaging\Entities\Ticket::find($message->ticket_id);

        if (!$ticket || (string) $ticket->user_id === (string) $message->sender_id) {
            return; // Owner already knows their own ticket activity
        }

        app(\Modules\Messaging\Services\MessagingService::class)->notifyUser(
            (string) $ticket->user_id,
            'New reply on your ticket',
            mb_substr($message->message, 0, 120),
            'ticket_reply',
            $message->ticket_id
        );
    }
}
