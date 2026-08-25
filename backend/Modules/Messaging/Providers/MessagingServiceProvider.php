<?php

namespace Modules\Messaging\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class MessagingServiceProvider extends ServiceProvider
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
        \Illuminate\Support\Facades\Event::listen(
            \Modules\Messaging\Events\TicketReplied::class,
            \Modules\Messaging\Listeners\NotifyUserOfReply::class,
        );

        \Illuminate\Support\Facades\Event::listen(
            \Modules\Messaging\Events\TicketCreated::class,
            \Modules\Messaging\Listeners\NotifyDepartmentOfTicket::class,
        );
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
