<?php

use Illuminate\Support\Facades\Facade;
use Illuminate\Support\ServiceProvider;

return [
    'name' => env('APP_NAME', 'EverythingNeed'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://127.0.0.1:8000'),
    'timezone' => 'UTC',
    'locale' => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-GCM',
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],
    'providers' => ServiceProvider::defaultProviders()->merge([
        // Core Providers
        App\Providers\AppServiceProvider::class,
        App\Providers\AuthServiceProvider::class,
        App\Providers\EventServiceProvider::class,
        App\Providers\RouteServiceProvider::class,

        // Module Service Providers
        Modules\Admin\Providers\AdminServiceProvider::class,
        Modules\Analytics\Providers\AnalyticsServiceProvider::class,
        Modules\Authentication\Providers\AuthenticationServiceProvider::class,
        Modules\Bookings\Providers\BookingsServiceProvider::class,
        Modules\BuildingServices\Providers\BuildingServicesServiceProvider::class,
        Modules\Categories\Providers\CategoriesServiceProvider::class,
        Modules\Checkout\Providers\CheckoutServiceProvider::class,
        Modules\Delivery\Providers\DeliveryServiceProvider::class,
        Modules\Engagement\Providers\EngagementServiceProvider::class,
        Modules\Experts\Providers\ExpertsServiceProvider::class,
        Modules\Food\Providers\FoodServiceProvider::class,
        Modules\Healthcare\Providers\HealthcareServiceProvider::class,
        Modules\Hotels\Providers\HotelsServiceProvider::class,
        Modules\Inventory\Providers\InventoryServiceProvider::class,
        Modules\Jobs\Providers\JobsServiceProvider::class,
        Modules\Learn\Providers\LearnServiceProvider::class,
        Modules\Messaging\Providers\MessagingServiceProvider::class,
        Modules\Needs\Providers\NeedsServiceProvider::class,
        Modules\Notifications\Providers\NotificationsServiceProvider::class,
        Modules\Orders\Providers\OrdersServiceProvider::class,
        Modules\Payments\Providers\PaymentsServiceProvider::class,
        Modules\Pharmacy\Providers\PharmacyServiceProvider::class,
        Modules\Products\Providers\ProductsServiceProvider::class,
        Modules\RealEstate\Providers\RealEstateServiceProvider::class,
        Modules\Reviews\Providers\ReviewsServiceProvider::class,
        Modules\Rides\Providers\RidesServiceProvider::class,
        Modules\Settings\Providers\SettingsServiceProvider::class,
        Modules\Subscriptions\Providers\SubscriptionsServiceProvider::class,
        Modules\Users\Providers\UsersServiceProvider::class,
        Modules\Vendors\Providers\VendorsServiceProvider::class,
        Modules\Wallet\Providers\WalletServiceProvider::class,
        Modules\Search\Providers\SearchServiceProvider::class,
        Modules\Upload\Providers\UploadServiceProvider::class,
    ])->toArray(),
    'aliases' => Facade::defaultAliases()->merge([
    ])->toArray(),
];
