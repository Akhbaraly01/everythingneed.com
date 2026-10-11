<?php

namespace Modules\Upload\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class UploadServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        if (file_exists(__DIR__ . '/../Routes/api.php')) {
            // Same-origin cookie auth requires Sanctum's stateful middleware to start a
    // session; without it every browser /api/* call 401s on these routes.
    Route::group(['middleware' => [\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]], __DIR__ . '/../Routes/api.php');
        }
    }
}
