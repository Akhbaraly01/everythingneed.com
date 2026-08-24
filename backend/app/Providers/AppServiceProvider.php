<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Core\Services\Contracts\AuthServiceInterface;
use Core\Services\AuthService;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\PermissionService;
use Core\Services\Contracts\NotificationServiceInterface;
use Core\Services\NotificationService;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\AuditService;
use Core\Services\Contracts\SearchServiceInterface;
use Core\Services\SearchService;
use Core\Services\Contracts\StorageServiceInterface;
use Core\Services\StorageService;
use Core\Services\Contracts\MediaServiceInterface;
use Core\Services\MediaService;
use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Services\PaymentGateway;
use Core\Services\Contracts\WalletServiceInterface;
use Core\Services\WalletService;
use Core\Services\Contracts\PricingServiceInterface;
use Core\Services\PricingService;
use Core\Services\Contracts\TaxServiceInterface;
use Core\Services\TaxService;
use Core\Services\Contracts\CommissionServiceInterface;
use Core\Services\CommissionService;
use Core\Services\Contracts\ReportingServiceInterface;
use Core\Services\ReportingService;
use Core\Services\Contracts\CurrencyServiceInterface;
use Core\Services\CurrencyService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(PermissionServiceInterface::class, PermissionService::class);
        $this->app->bind(NotificationServiceInterface::class, NotificationService::class);
        $this->app->bind(AuditServiceInterface::class, AuditService::class);
        $this->app->bind(SearchServiceInterface::class, SearchService::class);
        $this->app->bind(StorageServiceInterface::class, StorageService::class);
        $this->app->bind(MediaServiceInterface::class, MediaService::class);
        $this->app->bind(PaymentGatewayInterface::class, PaymentGateway::class);
        $this->app->bind(WalletServiceInterface::class, WalletService::class);
        $this->app->bind(PricingServiceInterface::class, PricingService::class);
        $this->app->bind(TaxServiceInterface::class, TaxService::class);
        $this->app->bind(CommissionServiceInterface::class, CommissionService::class);
        $this->app->bind(ReportingServiceInterface::class, ReportingService::class);
        $this->app->bind(CurrencyServiceInterface::class, CurrencyService::class);
    }

    public function boot(): void
    {
        //
    }
}
