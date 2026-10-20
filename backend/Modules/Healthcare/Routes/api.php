<?php

use Illuminate\Support\Facades\Route;
use Modules\Healthcare\Http\Controllers\DoctorController;
use Modules\Healthcare\Http\Controllers\AppointmentController;
use Modules\Healthcare\Http\Controllers\HealthContentController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/doctors', [DoctorController::class, 'store'])->middleware('permission:healthcare.doctors.manage');
        Route::put('/doctors/{id}/availability', [DoctorController::class, 'setAvailability']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
        Route::post('/appointments/{id}/pay', [AppointmentController::class, 'pay']);
        Route::get('/appointments/{id}/consultation', [AppointmentController::class, 'consultationRecord']);
        Route::get('/appointments/{id}/messages', [AppointmentController::class, 'messages']);
        Route::post('/appointments/{id}/messages', [AppointmentController::class, 'postMessage']);
Route::post('/appointments/{id}/video-room', [AppointmentController::class, 'videoRoom']);
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::post('/appointments/{id}/assign-doctor', [AppointmentController::class, 'assignDoctor'])->middleware('permission:healthcare.appointments.manage');
        Route::post('/appointments/{id}/start', [AppointmentController::class, 'start']);
        Route::post('/appointments/{id}/complete', [AppointmentController::class, 'complete']);

        // Admin console reads (healthcare workspace)
        Route::get('/admin/healthcare/tickets', [AppointmentController::class, 'adminTickets'])
            ->middleware('permission:healthcare.appointments.view');
        Route::get('/admin/healthcare/consultations', [\Modules\Healthcare\Http\Controllers\HealthCompatController::class, 'adminConsultations'])
            ->middleware('permission:healthcare.appointments.view');

        // W8: provider profile edit + guarded delete.
        Route::put('/admin/healthcare/doctors/{id}', [DoctorController::class, 'adminUpdate'])
            ->middleware('permission:healthcare.doctors.manage')
            ->where('id', '[0-9a-f-]{36}');
        Route::delete('/admin/healthcare/doctors/{id}', [DoctorController::class, 'adminDestroy'])
            ->middleware('permission:healthcare.doctors.manage')
            ->where('id', '[0-9a-f-]{36}');

        // Lab console (healthcare workspace): manage the catalog + overview bookings.
        // Bookings must precede /labs/{id} or "bookings" matches {id}.
        Route::get('/admin/healthcare/labs', [\Modules\Healthcare\Http\Controllers\LabController::class, 'adminList'])
            ->middleware('permission:healthcare.labs.manage');
        Route::get('/admin/healthcare/labs/bookings', [\Modules\Healthcare\Http\Controllers\LabController::class, 'adminBookings'])
            ->middleware('permission:healthcare.labs.manage');
        Route::post('/admin/healthcare/labs', [\Modules\Healthcare\Http\Controllers\LabController::class, 'store'])
            ->middleware('permission:healthcare.labs.manage');
        Route::put('/admin/healthcare/labs/{id}', [\Modules\Healthcare\Http\Controllers\LabController::class, 'update'])
            ->middleware('permission:healthcare.labs.manage')
            ->where('id', '[0-9a-f-]{36}');
        Route::delete('/admin/healthcare/labs/{id}', [\Modules\Healthcare\Http\Controllers\LabController::class, 'destroy'])
            ->middleware('permission:healthcare.labs.manage')
            ->where('id', '[0-9a-f-]{36}');

        // H-C: Aid / Charity review queue (requester files -> support reviews).
        Route::get('/admin/healthcare/aid', [\Modules\Healthcare\Http\Controllers\AidController::class, 'adminList'])
            ->middleware('permission:healthcare.aid.view');
        Route::put('/admin/healthcare/aid/{id}', [\Modules\Healthcare\Http\Controllers\AidController::class, 'adminDecide'])
            ->middleware('permission:healthcare.aid.manage')
            ->where('id', '[0-9a-f-]{36}');

        // H-D: "Others" service-request triage queue.
        Route::get('/admin/healthcare/service-requests', [\Modules\Healthcare\Http\Controllers\ServiceRequestController::class, 'adminList'])
            ->middleware('permission:healthcare.appointments.view');
        Route::put('/admin/healthcare/service-requests/{id}', [\Modules\Healthcare\Http\Controllers\ServiceRequestController::class, 'adminDecide'])
            ->middleware('permission:healthcare.appointments.manage')
            ->where('id', '[0-9a-f-]{36}');

        // H-D: Documentation hub library management (all types incl. inactive).
        Route::get('/admin/healthcare/content', [\Modules\Healthcare\Http\Controllers\HealthContentController::class, 'adminList'])
            ->middleware('permission:healthcare.content.view');
        Route::post('/admin/healthcare/content', [\Modules\Healthcare\Http\Controllers\HealthContentController::class, 'adminStore'])
            ->middleware('permission:healthcare.content.manage');
        Route::put('/admin/healthcare/content/{id}', [\Modules\Healthcare\Http\Controllers\HealthContentController::class, 'adminUpdate'])
            ->middleware('permission:healthcare.content.manage')
            ->where('id', '[0-9a-f-]{36}');
        Route::delete('/admin/healthcare/content/{id}', [\Modules\Healthcare\Http\Controllers\HealthContentController::class, 'adminDestroy'])
            ->middleware('permission:healthcare.content.manage')
            ->where('id', '[0-9a-f-]{36}');
    });

    // Public reads (single registration — no shadowing)
    Route::get('/doctors', [DoctorController::class, 'index']);
    Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability']);
    Route::get('/doctors/{id}', [DoctorController::class, 'show']);

    // Health education content
    Route::get('/healthcare/videos/{id}', [HealthContentController::class, 'show'])->defaults('type', 'videos');
    Route::get('/healthcare/documents/{id}', [HealthContentController::class, 'show'])->defaults('type', 'documents');
    Route::get('/healthcare/videos', [HealthContentController::class, 'index'])->defaults('type', 'videos');
    Route::get('/healthcare/documents', [HealthContentController::class, 'index'])->defaults('type', 'documents');
    Route::get('/healthcare/categories', [HealthContentController::class, 'index'])->defaults('type', 'categories');
    Route::get('/healthcare/prevention-guides', [HealthContentController::class, 'index'])->defaults('type', 'prevention-guides');

    // H-C: Aid / Charity - public reads (approved/funded only; detail is
    // 404 for pending/rejected unless the requester views their own).
    Route::get('/health/aid', [\Modules\Healthcare\Http\Controllers\AidController::class, 'index']);
    Route::get('/health/aid/{id}', [\Modules\Healthcare\Http\Controllers\AidController::class, 'show'])->where('id', '[0-9a-f-]{36}');

        // Compat aliases for deep Inertia pages (virtual/labs/tickets shorthand)
        Route::get('/health/tickets/{id}', [AppointmentController::class, 'show'])->middleware('auth:sanctum');
        Route::get('/health/tickets', [AppointmentController::class, 'index'])->middleware('auth:sanctum');
        Route::post('/health/tickets', [AppointmentController::class, 'store'])->middleware('auth:sanctum');

        // Laboratory (spec 24): real catalog + booking + payment + history.
        // Booking routes must precede /labs/{id} or "bookings" matches {id}.
        Route::get('/health/labs', [\Modules\Healthcare\Http\Controllers\LabController::class, 'index']);
        Route::post('/health/labs/book', [\Modules\Healthcare\Http\Controllers\LabController::class, 'book'])->middleware('auth:sanctum');
        Route::get('/health/labs/bookings', [\Modules\Healthcare\Http\Controllers\LabController::class, 'myBookings'])->middleware('auth:sanctum');
        Route::get('/health/labs/bookings/{id}', [\Modules\Healthcare\Http\Controllers\LabController::class, 'bookingShow'])->middleware('auth:sanctum')->where('id', '[0-9a-f-]{36}');
        Route::post('/health/labs/bookings/{id}/pay', [\Modules\Healthcare\Http\Controllers\LabController::class, 'pay'])->middleware('auth:sanctum')->where('id', '[0-9a-f-]{36}');
        Route::post('/health/labs/bookings/{id}/cancel', [\Modules\Healthcare\Http\Controllers\LabController::class, 'cancel'])->middleware('auth:sanctum')->where('id', '[0-9a-f-]{36}');
        Route::get('/health/labs/{id}', [\Modules\Healthcare\Http\Controllers\LabController::class, 'show'])->where('id', '[0-9a-f-]{36}');

        // H-C: Aid / Charity - requester + donor surfaces (authed).
        // "mine"/"donations" must precede /{id} or they match {id}.
        Route::get('/health/aid/mine', [\Modules\Healthcare\Http\Controllers\AidController::class, 'myRequests'])->middleware('auth:sanctum');
        Route::get('/health/aid/donations', [\Modules\Healthcare\Http\Controllers\AidController::class, 'myDonations'])->middleware('auth:sanctum');
        Route::post('/health/aid', [\Modules\Healthcare\Http\Controllers\AidController::class, 'store'])->middleware('auth:sanctum');
        Route::post('/health/aid/{id}/donate', [\Modules\Healthcare\Http\Controllers\AidController::class, 'donate'])->middleware('auth:sanctum')->where('id', '[0-9a-f-]{36}');

        // H-D: "Others" custom service requests (authed). "mine" must
        // precede any /{id} route on the same prefix.
        Route::get('/health/service-requests/mine', [\Modules\Healthcare\Http\Controllers\ServiceRequestController::class, 'mine'])->middleware('auth:sanctum');
        Route::post('/health/service-requests', [\Modules\Healthcare\Http\Controllers\ServiceRequestController::class, 'store'])->middleware(['auth:sanctum', 'throttle:20,1']);

        Route::get('/health/doctors', [DoctorController::class, 'index']);
    Route::get('/health/emergency', [\Modules\Healthcare\Http\Controllers\HealthCompatController::class, 'emergency']);
    Route::get('/health/consultations', [\Modules\Healthcare\Http\Controllers\HealthCompatController::class, 'consultations'])
        ->middleware('auth:sanctum');
});
