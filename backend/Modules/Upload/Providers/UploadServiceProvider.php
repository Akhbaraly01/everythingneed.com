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
            Route::group([], __DIR__ . '/../Routes/api.php');
        }
    }
}
