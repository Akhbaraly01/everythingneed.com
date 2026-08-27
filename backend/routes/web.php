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

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
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

Route::middleware('auth')->group(function () {
    Route::get('/settings/profile', function () {
        return inertia('settings/Profile');
    })->name('settings.profile');

    Route::get('/settings/security', function () {
        return inertia('settings/Security');
    })->name('settings.security');

    Route::get('/settings/notifications', function () {
        return inertia('settings/Notifications');
    })->name('settings.notifications');
});

    Route::get('/account/profile', function () {
        return inertia('account/Profile');
    })->name('account.profile');

    Route::get('/account/change-password', function () {
        return inertia('account/ChangePassword');
    })->name('account.change-password');

    Route::get('/account/addresses', function () {
        return inertia('account/Addresses');
    })->name('account.addresses');

    Route::get('/account/dashboard', function () {
        return inertia('account/Dashboard');
    })->name('account.dashboard');

    Route::get('/account', function () {
        return inertia('account/Index');
    })->name('account.index');

    Route::get('/account/orders', function () {
        return inertia('orders/Index');
    })->name('account.orders');

    Route::get('/account/notifications', function () {
        return inertia('notifications/Index');
    })->name('account.notifications');

    Route::get('/account/certificates', function () {
        return inertia('learn/Certificates');
    })->name('account.certificates');

    Route::get('/account/learning', function () {
        return inertia('learn/MyLearning');
    })->name('account.learning');

    Route::get('/account/bookings', function () {
        return inertia('account/Bookings');
    })->name('account.bookings');

    Route::get('/account/applications', function () {
        return inertia('account/Applications');
    })->name('account.applications');

    Route::get('/account/healthcare-history', function () {
        return inertia('account/HealthcareHistory');
    })->name('account.healthcare-history');

    Route::get('/account/reviews', function () {
        return inertia('account/Reviews');
    })->name('account.reviews');

    Route::get('/wishlist', function () {
        return inertia('Wishlist');
    })->name('wishlist');

    Route::get('/stores', function () {
        return inertia('stores/Index');
    })->name('stores.index');

    Route::get('/stores/{id}', function () {
        return inertia('stores/Show');
    })->name('stores.show');

    Route::get('/wallet', [WalletPageController::class, 'index'])->name('wallet.index');
    Route::get('/orders', [OrdersPageController::class, 'index'])->name('orders.index');
    Route::get('/orders/{id}', [OrdersPageController::class, 'show'])->name('orders.show');
    Route::get('/orders/checkout', [CheckoutPageController::class, 'index'])->name('orders.checkout');
    Route::get('/orders/{id}/tracking', function ($id) {
        return inertia('orders/Tracking', ['order_id' => $id]);
    })->name('orders.tracking');
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
Route::get('/products/compare', function () {
    return inertia('products/Compare');
})->name('products.compare');
Route::get('/products', [ProductsPageController::class, 'index'])->name('products.index');
Route::get('/products/{id}', [ProductsPageController::class, 'show'])->name('products.show');

Route::get('/jobs', [JobsPageController::class, 'index'])->name('jobs.index');
Route::get('/jobs/{id}', [JobsPageController::class, 'show'])->name('jobs.show');

Route::middleware('auth')->group(function () {
    Route::get('/jobs/{id}/apply', function ($id) {
        return inertia('jobs/Apply', ['job_id' => $id]);
    })->name('jobs.apply');

    Route::get('/jobs/applications', function () {
        return inertia('jobs/Applications');
    })->name('jobs.applications');

    Route::get('/food/orders/{id}', function () {
        return inertia('food/OrderTracking');
    })->name('food.order-tracking');

    Route::get('/pharmacy/checkout', function () {
        return inertia('pharmacy/Checkout');
    })->name('pharmacy.checkout');

    Route::get('/pharmacy/orders/{id}', function () {
        return inertia('pharmacy/OrderTracking');
    })->name('pharmacy.order-tracking');
});

Route::get('/hotels', [HotelsPageController::class, 'index'])->name('hotels.index');
Route::get('/hotels/{id}/rooms/{roomId}', function ($id, $roomId) {
    return inertia('hotels/RoomDetails', ['hotel_id' => $id, 'room_id' => $roomId]);
})->name('hotels.room');
Route::get('/hotels/{id}', [HotelsPageController::class, 'show'])->name('hotels.show');
Route::get('/hotels/{id}/book', [HotelsPageController::class, 'booking'])->name('hotels.booking');
Route::middleware('auth')->group(function () {
    Route::get('/hotels/reservations', function () {
        return inertia('hotels/Reservations');
    })->name('hotels.reservations');
});

Route::get('/food/checkout', function () {
    return inertia('food/Checkout');
})->name('food.checkout.page')->middleware('auth');
Route::get('/food/order-history', function () {
    return inertia('food/OrderHistory');
})->name('food.order-history')->middleware('auth');
Route::get('/food/cart', function () {
    return inertia('food/Cart');
})->name('food.cart');
Route::get('/food', [FoodPageController::class, 'index'])->name('food.index');
Route::get('/food/{id}', [FoodPageController::class, 'show'])->name('food.show');

Route::get('/vendors', [VendorsPageController::class, 'index'])->name('vendors.index');
Route::get('/vendors/{id}', [VendorsPageController::class, 'show'])->name('vendors.show');

Route::get('/needs/history', function () {
    return inertia('needs/History');
})->name('needs.history')->middleware('auth');
Route::get('/needs/requests/{id}', function ($id) {
    return inertia('needs/Show', ['need_id' => $id]);
})->name('needs.show')->middleware('auth');
Route::get('/needs', function () {
    return inertia('needs/Index');
})->name('needs.index');

Route::middleware('auth')->group(function () {
    Route::get('/needs/request', function () {
        return inertia('needs/Request');
    })->name('needs.request');
});

Route::get('/needs/{slug}', function ($slug) {
    return inertia('needs/Category', ['slug' => $slug]);
})->name('needs.category');

Route::get('/learn/courses', function () {
    return inertia('learn/Catalog');
})->name('learn.catalog');
Route::get('/learn/instructors/{id}', function ($id) {
    return inertia('learn/InstructorProfile', ['instructor_id' => $id]);
})->name('learn.instructor');
Route::get('/learn/quiz-results', function () {
    return inertia('learn/QuizResults');
})->name('learn.quiz-results')->middleware('auth');
Route::get('/learn', [LearnPageController::class, 'index'])->name('learn.index');
Route::get('/learn/{id}', [LearnPageController::class, 'show'])->name('learn.show');

Route::middleware('auth')->group(function () {
    Route::get('/learn/my-learning', function () {
        return inertia('learn/MyLearning');
    })->name('learn.my-learning');

    Route::get('/learn/courses/{courseId}/lessons/{lessonId}', function ($courseId, $lessonId) {
        return inertia('learn/Lesson', ['course_id' => $courseId, 'lesson_id' => $lessonId]);
    })->name('learn.lesson');

    Route::get('/learn/courses/{courseId}/quiz', function ($courseId) {
        return inertia('learn/Quiz', ['course_id' => $courseId]);
    })->name('learn.quiz');

    Route::get('/learn/certificates', function () {
        return inertia('learn/Certificates');
    })->name('learn.certificates');
});

Route::get('/properties/create', function () {
    return inertia('properties/Create');
})->name('properties.create')->middleware('auth');
Route::get('/properties/{id}/inquiry', function ($id) {
    return inertia('properties/Inquiry', ['property_id' => $id]);
})->name('properties.inquiry');
Route::get('/properties', [PropertiesPageController::class, 'index'])->name('properties.index');
Route::get('/properties/{id}', [PropertiesPageController::class, 'show'])->name('properties.show');

Route::middleware('auth')->group(function () {

    Route::get('/vendor/register', function () {
        return inertia('vendors/Register');
    })->name('vendor.register');

    Route::get('/vendor/analytics', function () {
        return inertia('vendor/Analytics');
    })->name('vendor.analytics');
});

Route::get('/healthcare', [HealthcarePageController::class, 'index'])->name('healthcare.index');

Route::get('/healthcare/booking-confirmation', function () {
    return inertia('healthcare/BookingConfirmation');
})->name('healthcare.booking-confirmation')->middleware('auth');
Route::get('/healthcare/virtual', function () {
    return inertia('healthcare/VirtualConsultation');
})->name('healthcare.virtual')->middleware('auth');
Route::get('/healthcare/labs', function () {
    return inertia('healthcare/Labs');
})->name('healthcare.labs');
Route::get('/healthcare/labs/{id}/book', function ($id) {
    return inertia('healthcare/LabBooking', ['test_id' => $id]);
})->name('healthcare.lab-book')->middleware('auth');

Route::get('/healthcare/specialty/{specialty}', function ($specialty) {
    return inertia('healthcare/Specialty', ['specialty' => $specialty]);
})->name('healthcare.specialty');

Route::get('/experts', function () {
    return inertia('experts/Index');
})->name('experts.index');

Route::get('/experts/{id}', function ($id) {
    return inertia('experts/Show', ['expert_id' => $id]);
})->name('experts.show');

Route::get('/deals', function () {
    return inertia('deals/Index');
})->name('deals.index');
Route::get('/deals/{id}', function ($id) {
    return inertia('deals/Show', ['deal_id' => $id]);
})->name('deals.show');

Route::get('/subscriptions', function () {
    return inertia('subscriptions/Index');
})->name('subscriptions.index');

Route::get('/reviews/create', function () {
    return inertia('reviews/Create');
})->name('reviews.create')->middleware('auth');
Route::get('/reviews', function () {
    return inertia('reviews/Index');
})->name('reviews.index');

Route::get('/categories', function () {
    return inertia('categories/Index');
})->name('categories.index');

Route::get('/categories/{id}', function ($id) {
    return inertia('categories/Show', ['category_id' => $id]);
})->name('categories.show');

Route::get('/payments', function () {
    return inertia('payments/Index');
})->name('payments.index');

Route::get('/analytics', function () {
    return inertia('analytics/Index');
})->name('analytics.index');

Route::get('/permissions', function () {
    return inertia('permissions/Index');
})->name('permissions.index');

Route::get('/deliveries', function () {
    return inertia('deliveries/Index');
})->name('deliveries.index');

Route::get('/inventory', function () {
    return inertia('inventory/Index');
})->name('inventory.index');

Route::get('/pharmacy', function () {
    return inertia('pharmacy/Index');
})->name('pharmacy.index');

Route::get('/pharmacy/cart', function () {
    return inertia('pharmacy/Cart');
})->name('pharmacy.cart');

Route::middleware('auth')->group(function () {
Route::get('/healthcare/doctors', function () {
    return inertia('healthcare/Doctors');
})->name('healthcare.doctors');

Route::get('/healthcare/doctors/{id}/profile', function ($id) {
    return inertia('healthcare/DoctorProfile', ['doctor_id' => $id]);
})->name('healthcare.doctor-profile');

Route::get('/healthcare/doctors/{id}', function ($id) {
    return inertia('healthcare/Book', ['doctor_id' => $id]);
})->name('healthcare.book');

    Route::get('/healthcare/appointments', function () {
        return inertia('healthcare/Appointments');
    })->name('healthcare.appointments');
});

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
Route::get('/tasks/create', [TasksPageController::class, 'create'])->name('tasks.create')->middleware('auth');
Route::get('/tasks/my-applications', [TasksPageController::class, 'myApplications'])->name('tasks.my-applications')->middleware('auth');
Route::get('/tasks/{id}/submit', function ($id) {
    return inertia('tasks/Submission', ['task_id' => $id]);
})->name('tasks.submit')->middleware('auth');
Route::get('/tasks', [TasksPageController::class, 'index'])->name('tasks.index');
Route::get('/tasks/{id}', [TasksPageController::class, 'show'])->name('tasks.show');

// ─── Messaging + Vendor portal (Inertia, auth) ────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/messages', [MessagingPageController::class, 'inbox'])->name('messages.inbox');
    Route::get('/messages/{id}', [MessagingPageController::class, 'thread'])->name('messages.thread');

    Route::get('/vendor', [VendorPortalPageController::class, 'dashboard'])->name('vendor.dashboard');
    Route::get('/vendor/products/create', function () {
        return inertia('vendor/ProductCreate');
    })->name('vendor.products.create');
    Route::get('/vendor/products/{id}/edit', function ($id) {
        return inertia('vendor/ProductEdit', ['product_id' => $id]);
    })->name('vendor.products.edit');
    Route::get('/vendor/products', [VendorPortalPageController::class, 'products'])->name('vendor.products');
    Route::get('/vendor/orders/{id}', function ($id) {
        return inertia('vendor/OrderDetails', ['order_id' => $id]);
    })->name('vendor.orders.show');
    Route::get('/vendor/orders', [VendorPortalPageController::class, 'orders'])->name('vendor.orders');
    Route::get('/vendor/payouts', [VendorPortalPageController::class, 'payouts'])->name('vendor.payouts');

    Route::get('/healthcare/appointments', [HealthcarePageController::class, 'appointments'])->name('healthcare.appointments');
    Route::get('/healthcare/prescriptions', [HealthcarePageController::class, 'prescriptions'])->name('healthcare.prescriptions');
    Route::get('/healthcare/appointments/{id}', [HealthcarePageController::class, 'appointmentDetail'])->name('healthcare.appointment.show');

    Route::get('/requests', [ServiceRequestsPageController::class, 'requests'])->name('requests.index');
});

// ─── Transportation (Inertia) ─────────────────────────────────────────────────
Route::get('/transportation', function () {
    return inertia('transportation/Index');
})->name('transportation.index');
Route::get('/transportation/ride-booking', function () {
    return inertia('transportation/RideBooking');
})->name('transportation.ride-booking')->middleware('auth');
Route::get('/transportation/tracking/{id}', function ($id) {
    return inertia('transportation/RideTracking', ['ride_id' => $id]);
})->name('transportation.tracking')->middleware('auth');
Route::get('/transportation/custom-request', function () {
    return inertia('transportation/CustomRequest');
})->name('transportation.custom-request')->middleware('auth');

// ─── Building Services deep (Inertia) ───────────────────────────────────────
Route::get('/building-services/book', function () {
    return inertia('building-services/Booking');
})->name('building-services.book')->middleware('auth');
Route::get('/building-services/bookings', function () {
    return inertia('building-services/Bookings');
})->name('building-services.bookings')->middleware('auth');
Route::get('/building-services/bookings/{id}', function ($id) {
    return inertia('building-services/BookingDetails', ['booking_id' => $id]);
})->name('building-services.booking-details')->middleware('auth');
Route::get('/building-services/workers/{id}', function ($id) {
    return inertia('building-services/WorkerProfile', ['worker_id' => $id]);
})->name('building-services.worker');

// ─── Agriculture deep (Inertia) ─────────────────────────────────────────────
Route::get('/agriculture/products', function () {
    return inertia('agriculture/Products');
})->name('agriculture.products');
Route::get('/agriculture/workers', function () {
    return inertia('agriculture/Workers');
})->name('agriculture.workers');

// ─── Pharmacy deep (Inertia) ────────────────────────────────────────────────
Route::get('/pharmacy/prescription-upload', function () {
    return inertia('pharmacy/PrescriptionUpload');
})->name('pharmacy.prescription-upload')->middleware('auth');

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
    Route::get('/dashboard', function () {
        return inertia('admin/Dashboard');
    })->name('admin.dashboard');
    Route::get('/', function () {
        return inertia('admin/Dashboard');
    })->name('admin.root');
    Route::get('/users', function () {
        return inertia('admin/Users');
    })->name('admin.users');
    Route::get('/vendors', function () {
        return inertia('admin/Vendors');
    })->name('admin.vendors');
    Route::get('/products', function () {
        return inertia('admin/Products');
    })->name('admin.products');
    Route::get('/orders', function () {
        return inertia('admin/Orders');
    })->name('admin.orders');
    Route::get('/payouts', function () {
        return inertia('admin/Payouts');
    })->name('admin.payouts');
    Route::get('/finance', function () {
        return inertia('admin/Finance');
    })->name('admin.finance');
    Route::get('/audit-logs', function () {
        return inertia('admin/AuditLogs');
    })->name('admin.audit-logs');
    Route::get('/system', function () {
        return inertia('admin/System');
    })->name('admin.system');
    Route::get('/analytics', function () {
        return inertia('admin/Analytics');
    })->name('admin.analytics');
    Route::get('/cms', function () {
        return inertia('admin/Cms');
    })->name('admin.cms');
    Route::get('/support/tickets', function () {
        return inertia('admin/Support');
    })->name('admin.support');
    Route::get('/healthcare/doctors', function () {
        return inertia('admin/Healthcare');
    })->name('admin.healthcare');
    Route::get('/learning/courses', function () {
        return inertia('admin/Learning');
    })->name('admin.learning');
    Route::get('/settings', function () {
        return inertia('admin/AdminSettings');
    })->name('admin.settings');
    Route::get('/category', function () {
        return inertia('admin/Categories');
    })->name('admin.category');
    Route::get('/roles', function () {
        return inertia('admin/Rbac');
    })->name('admin.roles');
    Route::get('/hotels', function () {
        return inertia('admin/Hotels');
    })->name('admin.hotels');
    Route::get('/food', function () {
        return inertia('admin/Food');
    })->name('admin.food');
    Route::get('/transport', function () {
        return inertia('admin/Transport');
    })->name('admin.transport');
    Route::get('/jobs', function () {
        return inertia('admin/Jobs');
    })->name('admin.jobs');
});

// ─── Catch-all: redirect unknown paths to SPA ────────────────────────────────
Route::get('/{path}', function (string $path) use ($frontendUrl) {
    return redirect()->away($frontendUrl($path));
})->where('path', '^(?!api|up|storage|sanctum|telescope).*$');
