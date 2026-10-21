<?php

namespace Modules\Services\Routes;

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnsureAccountActive;
use Modules\Services\Http\Controllers\AdminServiceCategoryController;
use Modules\Services\Http\Controllers\AdminServiceController;
use Modules\Services\Http\Controllers\ServiceCatalogController;

Route::prefix('api')->group(function () {
    // Public discovery (spec 100: created services are auto-discoverable).
    Route::get('/services', [ServiceCatalogController::class, 'index']);
    Route::get('/service-categories', [ServiceCatalogController::class, 'categories']);
    Route::get('/services/{id}', [ServiceCatalogController::class, 'show']);

    // Authenticated booking + payment.
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/services/{id}/book', [ServiceCatalogController::class, 'book']);
        Route::get('/services/bookings/mine', [ServiceCatalogController::class, 'myBookings']);
        Route::post('/services/bookings/{bookingId}/cancel', [ServiceCatalogController::class, 'cancelBooking']);
        Route::post('/services/bookings/{bookingId}/pay', [ServiceCatalogController::class, 'payBooking']);
    });

    // Admin console (spec 39).
    Route::middleware(['auth:sanctum', EnsureAccountActive::class])->group(function () {
        Route::get('/admin/services', [AdminServiceController::class, 'index'])
            ->middleware('permission:services.overview.view');

        // M-1 taxonomy console (roots + subcategories + icons).
        Route::get('/admin/service-categories', [AdminServiceCategoryController::class, 'index'])
            ->middleware('permission:services.overview.view');
        Route::post('/admin/service-categories', [AdminServiceCategoryController::class, 'store'])
            ->middleware('permission:services.overview.manage');
        Route::put('/admin/service-categories/{id}', [AdminServiceCategoryController::class, 'update'])
            ->middleware('permission:services.overview.manage');
        Route::delete('/admin/service-categories/{id}', [AdminServiceCategoryController::class, 'destroy'])
            ->middleware('permission:services.overview.manage');

        Route::post('/admin/services', [AdminServiceController::class, 'store'])
            ->middleware('permission:services.overview.manage');
        Route::get('/admin/services/{id}', [AdminServiceController::class, 'show'])
            ->middleware('permission:services.overview.view');
        Route::put('/admin/services/{id}', [AdminServiceController::class, 'update'])
            ->middleware('permission:services.overview.manage');
        Route::delete('/admin/services/{id}', [AdminServiceController::class, 'destroy'])
            ->middleware('permission:services.overview.manage');
        Route::get('/admin/services-bookings', [AdminServiceController::class, 'bookings'])
            ->middleware('permission:services.overview.view');
        Route::put('/admin/services-bookings/{bookingId}', [AdminServiceController::class, 'updateBookingStatus'])
            ->middleware('permission:services.overview.manage');
    });
});
