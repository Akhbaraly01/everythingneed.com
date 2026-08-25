<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Backend browser routes. The frontend dev app runs at FRONTEND_URL.
| API JSON routes live in routes/api.php.
|
*/

$frontendUrl = function (string $path = ''): string {
    $base = rtrim(config('app.frontend_url', 'http://127.0.0.1:8080'), '/');

    return $base.'/'.ltrim($path, '/');
};

Route::get('/', function () use ($frontendUrl) {
    return redirect()->away($frontendUrl());
})->name('home');

Route::get('/up', function () {
    $db = 'ok';
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        $db = 'error: ' . $e->getMessage();
    }

    return response()->json([
        'status' => 'operational',
        'service' => config('app.name'),
        'version' => app()->version(),
        'php' => phpversion(),
        'environment' => config('app.env'),
        'database' => $db,
        'cache' => config('cache.default'),
        'session' => config('session.driver'),
        'queue' => config('queue.default'),
        'frontend' => config('app.frontend_url', 'http://127.0.0.1:8080'),
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/robots.txt', function () {
    return response("User-agent: *\nDisallow: /api/\n", 200, ['Content-Type' => 'text/plain']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return inertia('Dashboard');
    })->name('dashboard');

    Route::get('/profile', function () {
        return inertia('Profile/Edit');
    })->name('profile.edit');
});

// Web (Inertia) authentication
use App\Http\Controllers\Web\WebAuthController;
use App\Http\Controllers\Web\JobSeekersPageController;
use App\Http\Controllers\Web\FlightsPageController;
use App\Http\Controllers\Web\TasksPageController;
use App\Http\Controllers\Web\MessagingPageController;
use App\Http\Controllers\Web\VendorPortalPageController;
use App\Http\Controllers\Web\HealthcarePageController;
use App\Http\Controllers\Web\ServiceRequestsPageController;
use App\Http\Controllers\Web\AdminPageController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register'])->middleware('throttle:10,1');
});

Route::post('/logout', [WebAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// Job Seekers (Inertia deep pages)
Route::get('/job-seekers', [JobSeekersPageController::class, 'index'])->name('job-seekers.index');
Route::middleware('auth')->group(function () {
    Route::get('/job-seekers/my-requests', [JobSeekersPageController::class, 'myRequests'])->name('job-seekers.my-requests');
    Route::get('/job-seekers/request/{worker}', [JobSeekersPageController::class, 'createRequest'])->name('job-seekers.request');
});
Route::get('/job-seekers/{id}', [JobSeekersPageController::class, 'show'])->name('job-seekers.show');

// Flights (Inertia deep pages)
Route::get('/flights', [FlightsPageController::class, 'search'])->name('flights.search');
Route::middleware('auth')->group(function () {
    Route::get('/flights/confirmation/{booking}', [FlightsPageController::class, 'confirmation'])->name('flights.confirmation');
    Route::get('/bookings', [FlightsPageController::class, 'myBookings'])->name('bookings.index');
});
Route::get('/flights/{id}', [FlightsPageController::class, 'show'])->name('flights.show');

// Task Center (Inertia deep pages)
Route::get('/tasks', [TasksPageController::class, 'index'])->name('tasks.index');
Route::middleware('auth')->group(function () {
    Route::get('/tasks/create', [TasksPageController::class, 'create'])->name('tasks.create');
    Route::get('/tasks/my-applications', [TasksPageController::class, 'myApplications'])->name('tasks.my-applications');
});
Route::get('/tasks/{id}', [TasksPageController::class, 'show'])->name('tasks.show');

// Messaging (Inertia deep pages)
Route::middleware('auth')->group(function () {
    Route::get('/messages', [MessagingPageController::class, 'inbox'])->name('messages.inbox');
    Route::get('/messages/{id}', [MessagingPageController::class, 'thread'])->name('messages.thread');

    // Vendor portal (Inertia)
    Route::get('/vendor', [VendorPortalPageController::class, 'dashboard'])->name('vendor.dashboard');
    Route::get('/vendor/products', [VendorPortalPageController::class, 'products'])->name('vendor.products');
    Route::get('/vendor/orders', [VendorPortalPageController::class, 'orders'])->name('vendor.orders');

    // Healthcare patient portal (Inertia)
    Route::get('/healthcare/appointments', [HealthcarePageController::class, 'appointments'])->name('healthcare.appointments');
    Route::get('/healthcare/prescriptions', [HealthcarePageController::class, 'prescriptions'])->name('healthcare.prescriptions');
    Route::get('/healthcare/appointments/{id}', [HealthcarePageController::class, 'appointmentDetail'])->name('healthcare.appointment.show');

    // Service requests (Deals/Needs deep chain)
    Route::get('/requests', [ServiceRequestsPageController::class, 'requests'])->name('requests.index');
});

// Public vertical landings (Inertia)
Route::get('/agriculture', [ServiceRequestsPageController::class, 'agriculture'])->name('agriculture.index');
Route::get('/building-services', [ServiceRequestsPageController::class, 'buildingServices'])->name('building-services.index');

// Admin console (Inertia, role-gated)
Route::middleware('role:super_admin,administrator,category_admin')->prefix('admin')->group(function () {
    Route::get('/approvals', [AdminPageController::class, 'approvals'])->name('admin.approvals');
});

Route::middleware('role:super_admin,administrator,customer_service,support_staff')->prefix('admin')->group(function () {
    Route::get('/departments', [AdminPageController::class, 'departments'])->name('admin.departments');
});

Route::middleware('role:super_admin')->prefix('admin')->group(function () {
    Route::get('/rbac', [AdminPageController::class, 'rbac'])->name('admin.rbac');
});

Route::get('/{path}', function (string $path) use ($frontendUrl) {
    return redirect()->away($frontendUrl($path));
})->where('path', '^(?!api|up|storage|sanctum|telescope).*$');
