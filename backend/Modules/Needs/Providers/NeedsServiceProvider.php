<?php

namespace Modules\Needs\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class NeedsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
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
