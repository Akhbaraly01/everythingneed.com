<?php

namespace Modules\Payments\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Modules\Payments\Events;
use Modules\Payments\Listeners;

class PaymentsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
        $this->registerListeners();
    }

    protected function registerListeners(): void
    {
        Event::listen(Events\PaymentCompleted::class, Listeners\UpdateOrderStatus::class);
        Event::listen(Events\RefundProcessed::class, Listeners\ProcessRefundNotification::class);
    }

    protected function registerRoutes(): void
    {
        if (file_exists(__DIR__ . '/../Routes/api.php')) {
            Route::group([], __DIR__ . '/../Routes/api.php');
        }
    }

    protected function registerResources(): void
    {
        if (is_dir(__DIR__ . '/../Database/Migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        }
    }
}
