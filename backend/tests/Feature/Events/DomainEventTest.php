<?php

namespace Tests\Feature\Events;

use Illuminate\Support\Facades\Event;
use Modules\Messaging\Entities\Ticket;
use Modules\Notifications\Events\NotificationCreated;
use Modules\Orders\Events\OrderCancelled;
use Modules\Orders\Events\OrderPlaced;
use Modules\Payments\Events\PaymentCompleted;
use Modules\Payments\Events\RefundProcessed;
use Modules\Messaging\Events\TicketCreated;
use Tests\TestCase;

class DomainEventTest extends TestCase
{
    public function test_order_placed_is_dispatched(): void
    {
        Event::fake([OrderPlaced::class]);

        $order = new \Modules\Orders\Entities\Order(['id' => \Illuminate\Support\Str::uuid()]);
        OrderPlaced::dispatch($order);

        Event::assertDispatched(OrderPlaced::class);
    }

    public function test_order_cancelled_is_dispatched(): void
    {
        Event::fake([OrderCancelled::class]);
        $order = new \Modules\Orders\Entities\Order(['id' => \Illuminate\Support\Str::uuid()]);
        OrderCancelled::dispatch($order);
        Event::assertDispatched(OrderCancelled::class);
    }

    public function test_payment_completed_and_refund_processed_dispatch(): void
    {
        Event::fake([PaymentCompleted::class, RefundProcessed::class]);

        $payment = new \Modules\Payments\Entities\Payment(['id' => \Illuminate\Support\Str::uuid()]);
        PaymentCompleted::dispatch($payment);

        $refund = new \Modules\Payments\Entities\Refund(['id' => \Illuminate\Support\Str::uuid()]);
        RefundProcessed::dispatch($refund);

        Event::assertDispatched(PaymentCompleted::class);
        Event::assertDispatched(RefundProcessed::class);
    }

    public function test_ticket_created_and_notification_created_dispatch(): void
    {
        Event::fake([TicketCreated::class, NotificationCreated::class]);

        $ticket = new Ticket(['id' => \Illuminate\Support\Str::uuid()]);
        TicketCreated::dispatch($ticket);
        NotificationCreated::dispatch('user-1', ['title' => 'hi']);

        Event::assertDispatched(TicketCreated::class);
        Event::assertDispatched(NotificationCreated::class);
    }

    public function test_production_listeners_are_registered(): void
    {
        $this->assertTrue(Event::hasListeners(OrderPlaced::class));
        $this->assertTrue(Event::hasListeners(OrderCancelled::class));
        $this->assertTrue(Event::hasListeners(PaymentCompleted::class));
        $this->assertTrue(Event::hasListeners(RefundProcessed::class));
        $this->assertTrue(Event::hasListeners(TicketCreated::class));
    }
}
