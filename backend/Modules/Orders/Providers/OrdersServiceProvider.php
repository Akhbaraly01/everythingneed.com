<?php

namespace Modules\Orders\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Modules\Orders\Events;
use Modules\Orders\Listeners;

class OrdersServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\Core\Services\Contracts\OrderQueryInterface::class, \Modules\Orders\Services\OrderQueryService::class);
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
        $this->registerListeners();
    }

    protected function registerListeners(): void
    {
        Event::listen(Events\OrderPlaced::class, Listeners\SendOrderConfirmation::class);
        Event::listen(Events\OrderCancelled::class, Listeners\ProcessOrderCancellation::class);
    }

    protected function registerRoutes(): void
    {
        if (file_exists(__DIR__ . '/../Routes/api.php')) {
            // Same-origin cookie auth requires Sanctum's stateful middleware to start a
    // session; without it every browser /api/* call 401s on these routes.
    Route::group(['middleware' => [\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]], __DIR__ . '/../Routes/api.php');
        }
    }

    protected function registerResources(): void
    {
        if (is_dir(__DIR__ . '/../Database/Migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        }
    }
}
