<?php

namespace Modules\Vendors\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Core\Services\Contracts\VendorQueryInterface;
use Modules\Vendors\Services\VendorQueryService;

class VendorsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(VendorQueryInterface::class, VendorQueryService::class);
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
