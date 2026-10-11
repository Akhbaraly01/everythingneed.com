<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        // Orders Events
        \Modules\Orders\Events\OrderPlaced::class => [
            \Modules\Orders\Listeners\SendOrderConfirmation::class,
        ],
        \Modules\Orders\Events\OrderCancelled::class => [
            \Modules\Orders\Listeners\ProcessOrderCancellation::class,
        ],

        // Payments Events
        \Modules\Payments\Events\PaymentCompleted::class => [
            \Modules\Payments\Listeners\UpdateOrderStatus::class,
        ],
        \Modules\Payments\Events\RefundProcessed::class => [
            \Modules\Payments\Listeners\ProcessRefundNotification::class,
        ],

        // Products Events
        \Modules\Products\Events\ProductStockLow::class => [
            \Modules\Products\Listeners\NotifyVendorLowStock::class,
        ],

        // Healthcare Events
        \Modules\Healthcare\Events\AppointmentBooked::class => [
            \Modules\Healthcare\Listeners\NotifyDoctorOfAppointment::class,
        ],
        \Modules\Healthcare\Events\DoctorAssigned::class => [
            \Modules\Healthcare\Listeners\NotifyPatientOfDoctorAssignment::class,
        ],

        // Messaging Events
        \Modules\Messaging\Events\TicketCreated::class => [
            \Modules\Messaging\Listeners\NotifyDepartmentOfTicket::class,
        ],
        \Modules\Messaging\Events\TicketReplied::class => [
            \Modules\Messaging\Listeners\NotifyUserOfReply::class,
        ],
    ];

    public function boot(): void
    {
        //
    }
}
