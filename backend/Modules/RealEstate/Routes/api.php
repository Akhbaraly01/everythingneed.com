<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\PropertyController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::get('/properties/my-listings', [PropertyController::class, 'myListings']);
        Route::post('/properties/{id}/inquiries', [PropertyController::class, 'inquiry']);
        Route::post('/properties/{id}/viewing-requests', [PropertyController::class, 'inquiry']);

        // N-43 viewing tour slots: owner workflow + requester statuses.
        Route::get('/properties/{id}/viewing-requests', [PropertyController::class, 'viewingRequests']);
        Route::post('/viewing-requests/{viewingId}/approve', [PropertyController::class, 'approveViewing']);
        Route::post('/viewing-requests/{viewingId}/reject', [PropertyController::class, 'rejectViewing']);
        Route::get('/my-viewing-requests', [PropertyController::class, 'myViewings']);
    });

    // Public reads
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{id}', [PropertyController::class, 'show']);

    // Admin console: create a listing (spec 47). Same authority as the
    // sibling console writes (PUT/DELETE /api/admin/properties/{id} in
    // Modules/Admin/Routes/api.php): real_estate.overview.manage. The
    // seeded roles (super_admin, administrator, building_admin,
    // real_estate_admin) hold real_estate.* and keep working.
    Route::post('/admin/properties', [PropertyController::class, 'store'])
        ->middleware('permission:real_estate.overview.manage');
});
