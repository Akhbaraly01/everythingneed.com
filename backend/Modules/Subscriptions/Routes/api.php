<?php

use Illuminate\Support\Facades\Route;
use Modules\Subscriptions\Http\Controllers\SubscriptionController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
        Route::get('/my-subscription', [SubscriptionController::class, 'mySubscription']);
        Route::post('/unsubscribe', [SubscriptionController::class, 'cancel']);
    });

    // Public read
    Route::get('/plans', [SubscriptionController::class, 'plans']);
});

// W8: plan catalogue management (page gate /admin/subscriptions:
// permission:subscriptions.subscriptions.view). The catalogue read is the
// view permission, every write is subscriptions.subscriptions.manage -
// the seeded roles (super_admin, administrator) hold subscriptions.* and
// keep working, while a custom role holding the permission is no longer
// blocked by a role list that never named it.
Route::middleware(['auth:sanctum', 'permission:subscriptions.subscriptions.view'])
    ->prefix('api/admin')
    ->group(function () {
        Route::get('/plans', [SubscriptionController::class, 'adminPlans']);
    });

Route::middleware(['auth:sanctum', 'permission:subscriptions.subscriptions.manage'])
    ->prefix('api/admin')
    ->group(function () {
        Route::post('/plans', [SubscriptionController::class, 'adminStorePlan']);
        Route::put('/plans/{id}', [SubscriptionController::class, 'adminUpdatePlan'])
            ->where('id', '[0-9a-f-]{36}');
        Route::delete('/plans/{id}', [SubscriptionController::class, 'adminDestroyPlan'])
            ->where('id', '[0-9a-f-]{36}');
    });
