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

// Web (Inertia) authentication & controllers
use App\Http\Controllers\Web\WebAuthController;
use App\Http\Controllers\Web\VerificationController;
use App\Http\Controllers\Web\JobSeekersPageController;
use App\Http\Controllers\Web\FlightsPageController;
use App\Http\Controllers\Web\TasksPageController;
use App\Http\Controllers\Web\MessagingPageController;
use App\Http\Controllers\Web\VendorPortalPageController;
use App\Http\Controllers\Web\HealthcarePageController;
use App\Http\Controllers\Web\ServiceRequestsPageController;
use App\Http\Controllers\Web\AdminPageController;
use App\Http\Controllers\Web\ProductsPageController;
use App\Http\Controllers\Web\OrdersPageController;
use App\Http\Controllers\Web\WalletPageController;
use App\Http\Controllers\Web\SettingsPageController;
use App\Http\Controllers\Web\JobsPageController;
use App\Http\Controllers\Web\HotelsPageController;
use App\Http\Controllers\Web\FoodPageController;
use App\Http\Controllers\Web\VendorsPageController;
use App\Http\Controllers\Web\LearnPageController;
use App\Http\Controllers\Web\PropertiesPageController;
use App\Http\Controllers\Web\CartPageController;
use App\Http\Controllers\Web\CheckoutPageController;
use App\Http\Controllers\Web\TicketsPageController;

Route::middleware('guest')->group(function () {
    Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register'])->middleware('throttle:10,1');
    Route::get('/forgot-password', function () {
        return inertia('auth/ForgotPassword');
    })->name('password.request');
    Route::post('/forgot-password', [WebAuthController::class, 'sendResetLink'])->middleware('throttle:6,1');
    Route::get('/reset-password/{token}', function (string $token) {
        $email = request()->query('email');
        return inertia('auth/ResetPassword', ['token' => $token, 'email' => $email]);
    })->name('password.reset');
    Route::post('/reset-password', [WebAuthController::class, 'resetPassword'])->middleware('throttle:6,1');
});

Route::post('/logout', [WebAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/email/verify', function () {
        return inertia('auth/VerifyEmail');
    })->name('verification.notice');

    Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,10'])
        ->name('verification.verify');

    Route::post('/email/verification-notification', [VerificationController::class, 'send'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

// ─── Auth-protected Inertia pages ─────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return inertia('Dashboard');
    })->name('dashboard');

    Route::get('/profile', function () {
        return inertia('Profile/Edit');
    })->name('profile.edit');

    Route::get('/settings', [SettingsPageController::class, 'index'])->name('settings.index');
    Route::get('/wallet', [WalletPageController::class, 'index'])->name('wallet.index');
    Route::get('/orders', [OrdersPageController::class, 'index'])->name('orders.index');
    Route::get('/orders/{id}', [OrdersPageController::class, 'show'])->name('orders.show');
    Route::get('/orders/checkout', [CheckoutPageController::class, 'index'])->name('orders.checkout');
    Route::get('/orders/returns', function () {
        return inertia('orders/Returns');
    })->name('orders.returns');
    Route::get('/orders/disputes', function () {
        return inertia('orders/Disputes');
    })->name('orders.disputes');

    Route::get('/tickets', [TicketsPageController::class, 'index'])->name('tickets.index');
    Route::get('/tickets/create', [TicketsPageController::class, 'create'])->name('tickets.create');
    Route::get('/tickets/{id}', [TicketsPageController::class, 'show'])->name('tickets.show');

    Route::get('/notifications', function () {
        return inertia('notifications/Index');
    })->name('notifications.index');
});

Route::get('/cart', [CartPageController::class, 'index'])->name('cart.index');

Route::get('/search', function () {
    return inertia('search/Results');
})->name('search.results');

// ─── Public Inertia pages ─────────────────────────────────────────────────────
Route::get('/products', [ProductsPageController::class, 'index'])->name('products.index');
Route::get('/products/{id}', [ProductsPageController::class, 'show'])->name('products.show');

Route::get('/jobs', [JobsPageController::class, 'index'])->name('jobs.index');
Route::get('/jobs/{id}', [JobsPageController::class, 'show'])->name('jobs.show');

Route::get('/hotels', [HotelsPageController::class, 'index'])->name('hotels.index');
Route::get('/hotels/{id}', [HotelsPageController::class, 'show'])->name('hotels.show');

Route::get('/food', [FoodPageController::class, 'index'])->name('food.index');
Route::get('/food/{id}', [FoodPageController::class, 'show'])->name('food.show');

Route::get('/vendors', [VendorsPageController::class, 'index'])->name('vendors.index');
Route::get('/vendors/{id}', [VendorsPageController::class, 'show'])->name('vendors.show');

Route::get('/learn', [LearnPageController::class, 'index'])->name('learn.index');
Route::get('/learn/{id}', [LearnPageController::class, 'show'])->name('learn.show');

Route::get('/properties', [PropertiesPageController::class, 'index'])->name('properties.index');
Route::get('/properties/{id}', [PropertiesPageController::class, 'show'])->name('properties.show');

Route::get('/healthcare', [HealthcarePageController::class, 'index'])->name('healthcare.index');

// ─── Job Seekers (Inertia deep pages) ─────────────────────────────────────────
Route::get('/job-seekers', [JobSeekersPageController::class, 'index'])->name('job-seekers.index');
Route::get('/job-seekers/{id}', [JobSeekersPageController::class, 'show'])->name('job-seekers.show');
Route::middleware('auth')->group(function () {
    Route::get('/job-seekers/my-requests', [JobSeekersPageController::class, 'myRequests'])->name('job-seekers.my-requests');
    Route::get('/job-seekers/request/{worker}', [JobSeekersPageController::class, 'createRequest'])->name('job-seekers.request');
});

// ─── Flights (Inertia deep pages) ─────────────────────────────────────────────
Route::get('/flights', [FlightsPageController::class, 'search'])->name('flights.search');
Route::get('/flights/{id}', [FlightsPageController::class, 'show'])->name('flights.show');
Route::middleware('auth')->group(function () {
    Route::get('/flights/confirmation/{booking}', [FlightsPageController::class, 'confirmation'])->name('flights.confirmation');
    Route::get('/bookings', [FlightsPageController::class, 'myBookings'])->name('bookings.index');
});

// ─── Task Center (Inertia deep pages) ─────────────────────────────────────────
Route::get('/tasks', [TasksPageController::class, 'index'])->name('tasks.index');
Route::get('/tasks/{id}', [TasksPageController::class, 'show'])->name('tasks.show');
Route::middleware('auth')->group(function () {
    Route::get('/tasks/create', [TasksPageController::class, 'create'])->name('tasks.create');
    Route::get('/tasks/my-applications', [TasksPageController::class, 'myApplications'])->name('tasks.my-applications');
});

// ─── Messaging + Vendor portal (Inertia, auth) ────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/messages', [MessagingPageController::class, 'inbox'])->name('messages.inbox');
    Route::get('/messages/{id}', [MessagingPageController::class, 'thread'])->name('messages.thread');

    Route::get('/vendor', [VendorPortalPageController::class, 'dashboard'])->name('vendor.dashboard');
    Route::get('/vendor/products', [VendorPortalPageController::class, 'products'])->name('vendor.products');
    Route::get('/vendor/orders', [VendorPortalPageController::class, 'orders'])->name('vendor.orders');
    Route::get('/vendor/payouts', [VendorPortalPageController::class, 'payouts'])->name('vendor.payouts');

    Route::get('/healthcare/appointments', [HealthcarePageController::class, 'appointments'])->name('healthcare.appointments');
    Route::get('/healthcare/prescriptions', [HealthcarePageController::class, 'prescriptions'])->name('healthcare.prescriptions');
    Route::get('/healthcare/appointments/{id}', [HealthcarePageController::class, 'appointmentDetail'])->name('healthcare.appointment.show');

    Route::get('/requests', [ServiceRequestsPageController::class, 'requests'])->name('requests.index');
});

// ─── Public vertical landings (Inertia) ───────────────────────────────────────
Route::get('/agriculture', [ServiceRequestsPageController::class, 'agriculture'])->name('agriculture.index');
Route::get('/building-services', [ServiceRequestsPageController::class, 'buildingServices'])->name('building-services.index');

// ─── Admin console (Inertia, role-gated) ──────────────────────────────────────
Route::middleware('role:super_admin,administrator,category_admin')->prefix('admin')->group(function () {
    Route::get('/approvals', [AdminPageController::class, 'approvals'])->name('admin.approvals');
    Route::get('/categories', [AdminPageController::class, 'categories'])->name('admin.categories');
});

Route::middleware('role:super_admin,administrator,customer_service,support_staff')->prefix('admin')->group(function () {
    Route::get('/departments', [AdminPageController::class, 'departments'])->name('admin.departments');
});

Route::middleware('role:super_admin')->prefix('admin')->group(function () {
    Route::get('/rbac', [AdminPageController::class, 'rbac'])->name('admin.rbac');
});

// ─── Catch-all: redirect unknown paths to SPA ────────────────────────────────
Route::get('/{path}', function (string $path) use ($frontendUrl) {
    return redirect()->away($frontendUrl($path));
})->where('path', '^(?!api|up|storage|sanctum|telescope).*$');
