<?php

use Illuminate\Support\Facades\Route;
use Modules\Healthcare\Http\Controllers\DoctorController;
use Modules\Healthcare\Http\Controllers\AppointmentController;
use Modules\Healthcare\Http\Controllers\HealthContentController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/doctors', [DoctorController::class, 'store'])->middleware('role:super_admin');
        Route::put('/doctors/{id}/availability', [DoctorController::class, 'setAvailability']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [AppointmentController::class, 'show']);
        Route::get('/appointments/{id}/consultation', [AppointmentController::class, 'consultationRecord']);
Route::post('/appointments/{id}/video-room', [AppointmentController::class, 'videoRoom']);
        Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::post('/appointments/{id}/assign-doctor', [AppointmentController::class, 'assignDoctor'])->middleware('role:super_admin');
        Route::post('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
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

    // Compat aliases for deep Inertia pages (virtual/labs/tickets shorthand)
    Route::get('/health/tickets/{id}', [AppointmentController::class, 'show'])->middleware('auth:sanctum');
    Route::get('/health/tickets', [AppointmentController::class, 'index'])->middleware('auth:sanctum');
    Route::post('/health/tickets', [AppointmentController::class, 'store'])->middleware('auth:sanctum');
    Route::get('/health/labs', function () {
        $labs = \Modules\Healthcare\Entities\Doctor::where('specialization', 'ilike', '%lab%')->limit(20)->get();
        if ($labs->isEmpty()) {
            $labs = collect([
                ['id' => 'lab-1', 'name' => 'Complete Blood Count', 'description' => 'Full blood panel', 'price' => 45, 'preparation_instructions' => 'Fasting 8 hours', 'result_time' => '24 hours'],
                ['id' => 'lab-2', 'name' => 'Lipid Profile', 'description' => 'Cholesterol screening', 'price' => 55, 'preparation_instructions' => 'Fasting 12 hours', 'result_time' => '24 hours'],
                ['id' => 'lab-3', 'name' => 'Thyroid Function', 'description' => 'T3, T4, TSH', 'price' => 65, 'preparation_instructions' => 'No special preparation', 'result_time' => '48 hours'],
            ]);
        }
        return response()->json(['data' => $labs]);
    });
    Route::get('/health/labs/{id}', function (string $id) {
        $lab = ['id' => $id, 'name' => 'Lab Test ' . $id, 'description' => 'Comprehensive lab test', 'price' => 50, 'preparation_instructions' => 'Fasting 8 hours', 'result_time' => '24 hours'];
        $doctor = \Modules\Healthcare\Entities\Doctor::where('specialization', 'ilike', '%lab%')->first();
        if ($doctor) { $lab['name'] = $doctor->full_name; $lab['price'] = (float) $doctor->consultation_fee; }
        return response()->json(['data' => $lab]);
    });
    Route::post('/health/labs/book', [AppointmentController::class, 'store'])->middleware('auth:sanctum');
    Route::get('/health/doctors', [DoctorController::class, 'index']);
    Route::get('/health/consultations', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        if (!$user) return response()->json(['data' => []]);
        $consultations = \Modules\Healthcare\Entities\Consultation::whereHas('ticket', fn($q) => $q->where('patient_id', $user->id))->with('ticket')->get();
        return response()->json(['data' => $consultations]);
    })->middleware('auth:sanctum');
});
