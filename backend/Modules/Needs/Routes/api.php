<?php

namespace Modules\Needs\Routes;

use Illuminate\Support\Facades\Route;
use Modules\Needs\Http\Controllers\NeedBookingController;
use Modules\Needs\Http\Controllers\NeedController;
use Modules\Needs\Http\Controllers\NeedCostGuideController;
use Modules\Needs\Http\Controllers\NeedEscrowController;
use Modules\Needs\Http\Controllers\NeedRequestController;
use Modules\Needs\Http\Controllers\ProviderProfileController;
use Modules\Needs\Http\Controllers\SavedItemController;
use Modules\Needs\Http\Controllers\TaskController;
use Modules\Needs\Http\Controllers\WorkroomController;

Route::prefix('api')->group(function () {
    Route::get('/need-categories', [NeedController::class, 'categories']);
    Route::get('/need-categories/{id}', [NeedController::class, 'category']);
    Route::get('/need-items', [NeedController::class, 'items']);
    Route::get('/need-items/{id}', [NeedController::class, 'show']);

    // Task board (public listing, auth for writes)
    Route::get('/tasks', [TaskController::class, 'index']);

    // Agriculture marketplace: products in the agriculture category
    Route::get('/agriculture', [NeedController::class, 'agriculture']);

    // Deals (public)
    Route::get('/deals', [NeedController::class, 'deals']);
    Route::get('/deals/{id}', [NeedController::class, 'deal']);

    // N-29 cost guides (public, published only)
    Route::get('/need-cost-guides', [NeedCostGuideController::class, 'index']);
    Route::get('/need-cost-guides/{slug}', [NeedCostGuideController::class, 'show']);
    // N-35 quote calculator (public estimate from the category's guide)
    Route::get('/need-estimates', [NeedCostGuideController::class, 'estimate']);

    Route::middleware('auth:sanctum')->group(function () {
        // Catalog management (vendor-published need items)
        Route::post('/need-items', [NeedController::class, 'store']);
        Route::put('/need-items/{id}', [NeedController::class, 'update']);
        Route::get('/my-listings', [NeedController::class, 'myListings']);

        // Need requests — full workflow
        Route::get('/need-requests', [NeedRequestController::class, 'index']);
        Route::post('/need-requests', [NeedRequestController::class, 'store']);
        Route::get('/provider-matches', [NeedRequestController::class, 'myMatches']);
        Route::get('/my-offers', [NeedRequestController::class, 'myOffers']);
        Route::get('/my-work', [NeedRequestController::class, 'myWork']);
        Route::get('/need-requests/{id}', [NeedRequestController::class, 'show']);
        Route::get('/need-requests/{id}/matches', [NeedRequestController::class, 'matches']);

        // TODO 15 fulfillment: progress, scope changes.
        Route::post('/need-requests/{id}/progress', [NeedRequestController::class, 'progress']);
        Route::get('/need-requests/{id}/scope-changes', [NeedRequestController::class, 'scopeChanges']);
        Route::post('/need-requests/{id}/scope-changes', [NeedRequestController::class, 'proposeScopeChange']);
        Route::post('/need-scope-changes/{changeId}/{decision}', [NeedRequestController::class, 'decideScopeChange'])
            ->whereIn('decision', ['accept', 'reject']);
        Route::put('/need-requests/{id}', [NeedRequestController::class, 'update']);
        Route::get('/need-requests/{id}/offers', [NeedRequestController::class, 'offers']);
        Route::post('/need-requests/{id}/offers', [NeedRequestController::class, 'submitOffer']);
        Route::post('/need-requests/{id}/offers/{offerId}/accept', [NeedRequestController::class, 'acceptOffer']);
        Route::post('/need-requests/{id}/offers/{offerId}/reject', [NeedRequestController::class, 'rejectOffer']);
        Route::post('/need-requests/{id}/offers/{offerId}/withdraw', [NeedRequestController::class, 'withdrawOffer']);
        Route::post('/need-requests/{id}/pay', [NeedRequestController::class, 'pay']);
        // N-24 workroom: shared files per engaged request (parties only).
        // Registered before {id}/{action} so 'files' can never read as a
        // transition action (and the action whereIn excludes it anyway).
        Route::get('/need-requests/{id}/files', [WorkroomController::class, 'index']);
        Route::post('/need-requests/{id}/files', [WorkroomController::class, 'store']);
        Route::get('/need-requests/{id}/files/{fileId}/url', [WorkroomController::class, 'signedUrl']);
        Route::delete('/need-requests/{id}/files/{fileId}', [WorkroomController::class, 'destroy']);

        // N-20 milestone escrow + N-21 milestone disputes + N-25 hourly
        // timesheets. Registered before {id}/{action} so a sub-resource can
        // never be read as a transition action.
        Route::get('/need-requests/{id}/milestones', [NeedEscrowController::class, 'milestones']);
        Route::post('/need-requests/{id}/milestones', [NeedEscrowController::class, 'storeMilestone']);
        Route::put('/need-requests/{id}/milestones/{milestoneId}', [NeedEscrowController::class, 'updateMilestone']);
        Route::post('/need-requests/{id}/milestones/{milestoneId}/fund', [NeedEscrowController::class, 'fundMilestone']);
        Route::post('/need-requests/{id}/milestones/{milestoneId}/release', [NeedEscrowController::class, 'releaseMilestone']);
        Route::post('/need-requests/{id}/milestones/{milestoneId}/refund', [NeedEscrowController::class, 'refundMilestone']);
        Route::post('/need-requests/{id}/milestones/{milestoneId}/dispute', [NeedEscrowController::class, 'openMilestoneDispute']);
        Route::get('/need-requests/{id}/timesheets', [NeedEscrowController::class, 'timesheets']);
        Route::post('/need-requests/{id}/timesheets', [NeedEscrowController::class, 'storeTimesheet']);
        Route::post('/need-requests/{id}/timesheets/pay', [NeedEscrowController::class, 'payTimesheets']);
        Route::post('/need-requests/{id}/timesheets/{entryId}/approve', [NeedEscrowController::class, 'approveTimesheet']);
        Route::post('/need-requests/{id}/timesheets/{entryId}/reject', [NeedEscrowController::class, 'rejectTimesheet']);

        Route::post('/need-requests/{id}/{action}', [NeedRequestController::class, 'transition'])
            ->whereIn('action', [
                'start', 'complete', 'accept', 'cancel', 'submit', 'publish', 'payment',
                'fulfill', 'reject', 'expire', 'dispute', 'refund',
            ]);

        // Task Center
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/{id}', [TaskController::class, 'show']);
        Route::post('/tasks/{id}/apply', [TaskController::class, 'apply']);
        Route::get('/tasks/{id}/applications', [TaskController::class, 'applications']);
        Route::get('/my-task-applications', [TaskController::class, 'myApplications']);
        Route::post('/task-applications/{applicationId}/{action}', [TaskController::class, 'applicationAction'])
            ->whereIn('action', ['approve', 'reject', 'submit', 'verify', 'mark-paid']);

// TODO 08 provider onboarding (own profile only).
Route::get('/provider-profile', [ProviderProfileController::class, 'show']);
Route::post('/provider-profile', [ProviderProfileController::class, 'store']);
Route::post('/provider-profile/availability', [ProviderProfileController::class, 'availability']);

        // TODO 18 workspace: duplicate, visibility, saved items.
        Route::post('/need-requests/{id}/duplicate', [NeedRequestController::class, 'duplicate']);
        Route::post('/need-requests/{id}/visibility', [NeedRequestController::class, 'visibility']);
        Route::get('/needs/saved', [SavedItemController::class, 'index']);
        Route::post('/needs/saved', [SavedItemController::class, 'store']);
        Route::delete('/needs/saved/{id}', [SavedItemController::class, 'destroy']);

        // TODO 13 scheduling + booking.
        Route::get('/my-bookings', [NeedBookingController::class, 'mine']);
        Route::get('/need-requests/{id}/bookings', [NeedBookingController::class, 'forRequest']);
        Route::post('/need-requests/{id}/bookings', [NeedBookingController::class, 'store']);
        Route::post('/need-bookings/{id}/reschedule', [NeedBookingController::class, 'reschedule']);
        Route::post('/need-bookings/{id}/cancel', [NeedBookingController::class, 'cancel']);
    });
});
