<?php

namespace Modules\Orders\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Orders\Entities\OrderTracking;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OrderTracking $tracking
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('order.'.$this->tracking->order_id),
            new PrivateChannel('user.'.$this->tracking->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->tracking->order_id,
            'status' => $this->tracking->status,
            'status_message' => $this->tracking->status_message,
            'created_at' => $this->tracking->created_at?->toIso8601String(),
        ];
    }
}
