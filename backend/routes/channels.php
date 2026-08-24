<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
| Authorization for private/presence channels over Reverb.
*/

// A user always receives events targeted at them (notifications).
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
});

// Chat participants.
Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    $conversation = \Modules\Messaging\Entities\ChatConversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    return in_array($user->id, [$conversation->customer_id, $conversation->worker_id], true)
        || $user->hasRole('super_admin')
        || $user->hasRole('administrator')
        || $user->hasRole('customer_service');
});

// Ticket participants (owner + staff).
Broadcast::channel('ticket.{ticketId}', function ($user, $ticketId) {
    $ticket = \Modules\Messaging\Entities\Ticket::find($ticketId);

    if (!$ticket) {
        return false;
    }

    return (string) $ticket->user_id === (string) $user->id
        || ($ticket->assigned_to && (string) $ticket->assigned_to === (string) $user->id)
        || $user->hasRole('super_admin')
        || $user->hasRole('administrator')
        || $user->hasRole('support_staff')
        || $user->hasRole('customer_service');
});

// Order tracking — buyer, involved vendor, or admins.
Broadcast::channel('order.{orderId}', function ($user, $orderId) {
    $order = \Modules\Orders\Entities\Order::find($orderId);

    if (!$order) {
        return false;
    }

    if ((string) $order->user_id === (string) $user->id) {
        return true;
    }

    if ($user->vendor && \DB::table('order_items')
        ->where('order_id', $orderId)
        ->where('vendor_id', $user->vendor->id)
        ->exists()) {
        return true;
    }

    return $user->hasRole('super_admin')
        || $user->hasRole('administrator');
});
