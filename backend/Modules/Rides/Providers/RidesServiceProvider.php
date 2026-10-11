<?php

namespace Modules\Rides\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class RidesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(\Core\Services\Contracts\FlightSeatInterface::class, \Modules\Rides\Services\FlightSeatService::class);
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
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
