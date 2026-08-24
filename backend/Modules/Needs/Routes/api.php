<?php

namespace Modules\Needs\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Needs\Http\Controllers\NeedController;
use Modules\Needs\Http\Controllers\NeedRequestController;
use Modules\Needs\Http\Controllers\TaskController;

Route::prefix('api')->group(function () {
    Route::get('/need-categories', [NeedController::class, 'categories']);
    Route::get('/need-items', [NeedController::class, 'items']);
    Route::get('/need-items/{id}', [NeedController::class, 'show']);

    // Task board (public listing, auth for writes)
    Route::get('/tasks', [TaskController::class, 'index']);

    // Agriculture marketplace: products in the agriculture category
    Route::get('/agriculture', function () {
        $products = \Modules\Products\Entities\Product::query()
            ->where('is_active', true)
            ->where('category', 'ilike', '%agric%')
            ->with('vendor')
            ->orderByDesc('created_at')
            ->paginate(request()->get('per_page', 15));

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    });

    Route::middleware('auth:sanctum')->group(function () {
        // Catalog management (vendor-published need items)
        Route::post('/need-items', [NeedController::class, 'store']);

        // Need requests — full workflow
        Route::get('/need-requests', [NeedRequestController::class, 'index']);
        Route::post('/need-requests', [NeedRequestController::class, 'store']);
        Route::get('/need-requests/{id}', [NeedRequestController::class, 'show']);
        Route::get('/need-requests/{id}/offers', [NeedRequestController::class, 'offers']);
        Route::post('/need-requests/{id}/offers', [NeedRequestController::class, 'submitOffer']);
        Route::post('/need-requests/{id}/offers/{offerId}/accept', [NeedRequestController::class, 'acceptOffer']);
        Route::post('/need-requests/{id}/pay', [NeedRequestController::class, 'pay']);
        Route::post('/need-requests/{id}/{action}', [NeedRequestController::class, 'transition'])
            ->whereIn('action', ['start', 'complete', 'cancel']);

        // Task Center
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/{id}', [TaskController::class, 'show']);
        Route::post('/tasks/{id}/apply', [TaskController::class, 'apply']);
        Route::get('/tasks/{id}/applications', [TaskController::class, 'applications']);
        Route::get('/my-task-applications', [TaskController::class, 'myApplications']);
        Route::post('/task-applications/{applicationId}/{action}', [TaskController::class, 'applicationAction'])
            ->whereIn('action', ['approve', 'reject', 'submit', 'verify', 'mark-paid']);
    });
});
