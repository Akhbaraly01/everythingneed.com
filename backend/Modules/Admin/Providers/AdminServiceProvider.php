<?php

namespace Modules\Admin\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Modules\Admin\Policies\AdminPolicy;

/**
 * AdminServiceProvider — Service provider for Admin Module.
 * Registers module routes and gate authorizations.
 */
class AdminServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerGates();
        $this->registerRoutes();
        $this->registerResources();
    }

    /**
     * Register module resources (migrations, views, etc.).
     */
    protected function registerResources(): void
    {
        if (is_dir(__DIR__ . '/../Database/Migrations')) {
            $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        }
    }

    /**
     * Register the Admin module routes.
     */
    protected function registerRoutes(): void
    {
        if (file_exists(__DIR__ . '/../Routes/api.php')) {
            Route::group([], __DIR__ . '/../Routes/api.php');
        }
    }

    /**
     * Register the Admin module authorization gates.
     */
    protected function registerGates(): void
    {
        Gate::define('viewDashboard',    [AdminPolicy::class, 'viewDashboard']);
        Gate::define('manageUsers',      [AdminPolicy::class, 'manageUsers']);
        Gate::define('manageVendors',    [AdminPolicy::class, 'manageVendors']);
        Gate::define('manageOrders',     [AdminPolicy::class, 'manageOrders']);
        Gate::define('viewFinance',      [AdminPolicy::class, 'viewFinance']);
        Gate::define('manageContent',    [AdminPolicy::class, 'manageContent']);
        Gate::define('viewAnalytics',    [AdminPolicy::class, 'viewAnalytics']);
        Gate::define('manageSupport',    [AdminPolicy::class, 'manageSupport']);
        Gate::define('manageHealthcare', [AdminPolicy::class, 'manageHealthcare']);
        Gate::define('manageLearning',   [AdminPolicy::class, 'manageLearning']);
        Gate::define('manageSettings',   [AdminPolicy::class, 'manageSettings']);
        Gate::define('viewAuditLogs',    [AdminPolicy::class, 'viewAuditLogs']);
        Gate::define('manageFinance',    [AdminPolicy::class, 'manageFinance']);
        Gate::define('manageCms',        [AdminPolicy::class, 'manageCms']);
    }
}
