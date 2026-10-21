<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Backend browser routes (single app: pages + API on this host).
| API JSON routes live in routes/api.php.
|
*/

// `/` (spec S8): guests + marketplace customers see Home; console roles
// (admin/vendor/provider) keep their role landing via HomePageController::root.
// FQCN: this route sits above the use-statement block below.
Route::get('/', [\App\Http\Controllers\Web\HomePageController::class, 'root'])->name('home');

Route::get('/up', function () {
    $db = 'ok';
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        // Redacted: driver messages carry host/user/table detail.
        \Illuminate\Support\Facades\Log::warning('Health probe database failure', [
            'error' => $e->getMessage(),
        ]);
        $db = 'error';
    }

    // Minimal probe: no version/php/env/driver fingerprinting.
    return response()->json([
        'status' => 'operational',
        'database' => $db,
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/robots.txt', function () {
    return response("User-agent: *\nDisallow: /api/\n", 200, ['Content-Type' => 'text/plain']);
});

// Multilingual Phase 0: explicit language selection (dropdown / settings).
// Guests get the long-lived `locale` cookie; signed-in users also persist
// the choice to their account. Throttled: this endpoint is a beacon, not
// a page.
Route::post('/locale', [\App\Http\Controllers\Web\LocaleController::class, 'update'])
    ->middleware('throttle:30,1')
    ->name('locale.update');

// Web (Inertia) authentication & controllers
use App\Http\Controllers\Web\WebAuthController;
use App\Http\Controllers\Web\VerificationController;
use App\Http\Controllers\Web\JobSeekersPageController;
use App\Http\Controllers\Web\FlightsPageController;
use App\Http\Controllers\Web\TasksPageController;
use App\Http\Controllers\Web\MessagingPageController;
use App\Http\Controllers\Web\VendorPortalPageController;
use App\Http\Controllers\Web\HealthcarePageController;
use App\Http\Controllers\Web\ServiceCatalogPageController;
use App\Http\Controllers\Web\ServiceRequestsPageController;
use App\Http\Controllers\Web\AdminPageController;
use App\Http\Controllers\Web\AdminDetailPageController;
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
use App\Http\Controllers\Web\CmsPageController;
use App\Http\Controllers\Web\CheckoutPageController;
use App\Http\Controllers\Web\TicketsPageController;
use App\Http\Controllers\Web\HomePageController;
use App\Http\Controllers\Web\ProviderPageController;

Route::middleware('guest')->group(function () {
Route::get('/login', [WebAuthController::class, 'showLogin'])->name('login');
Route::post('/login', [WebAuthController::class, 'login'])->middleware(['throttle:10,1', 'turnstile']);
// Authenticator-app challenge (web guard enforces 2FA like the API does).
Route::get('/2fa/challenge', [WebAuthController::class, 'showChallenge'])->name('2fa.challenge');
Route::post('/2fa/challenge', [WebAuthController::class, 'challenge'])->middleware('throttle:10,1');
// Suspended accounts land here with an appeal path (plan Q).
Route::get('/suspended', function () {
    return inertia('auth/Suspended');
})->name('suspended');
    Route::get('/register', [WebAuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [WebAuthController::class, 'register'])->middleware(['throttle:10,1', 'turnstile']);
    Route::get('/forgot-password', function () {
        return inertia('auth/ForgotPassword');
    })->name('password.request');
    Route::post('/forgot-password', [WebAuthController::class, 'sendResetLink'])->middleware(['throttle:6,1', 'turnstile']);
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
    Route::get('/dashboard', [HomePageController::class, 'dashboard'])->name('dashboard');

    Route::get('/profile', function () {
        return inertia('account/Profile');
    })->name('profile.edit');

    Route::get('/settings', [SettingsPageController::class, 'index'])->name('settings.index');

    Route::middleware('auth')->group(function () {
        Route::get('/settings/profile', function () {
            return redirect()->route('account.profile');
        })->name('settings.profile');

        // Consolidated into settings/Index tabs (notifications + security).
        Route::redirect('/settings/security', '/settings', 301)->name('settings.security');

        Route::redirect('/settings/notifications', '/settings', 301)->name('settings.notifications');
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

    Route::get('/account/orders', [OrdersPageController::class, 'index'])->name('account.orders');

    Route::get('/account/orders/{id}', [OrdersPageController::class, 'show'])->name('account.orders.show');

    Route::redirect('/account/security', '/settings', 301)->name('account.security');

    Route::get('/account/privacy', function () {
        return inertia('account/Privacy');
    })->name('account.privacy');

    Route::get('/account/sessions', function () {
        return inertia('account/Sessions');
    })->name('account.sessions');

    Route::get('/account/bookings/{id}', function (string $id) {
        return inertia('account/BookingDetail', ['booking_id' => $id]);
    })->name('account.bookings.show');

    Route::get('/account/needs', function () {
        return inertia('needs/MyNeeds');
    })->name('account.needs');

    Route::get('/account/needs/{id}', function (string $id) {
        return inertia('needs/my/Overview', ['need_id' => $id]);
    })->name('account.needs.show');

    Route::get('/account/wishlist', function () {
        return inertia('Wishlist');
    })->name('account.wishlist');

    Route::get('/account/messages', [MessagingPageController::class, 'inbox'])->name('account.messages');

    Route::get('/account/messages/{id}', [MessagingPageController::class, 'thread'])->name('account.messages.show');

    Route::get('/account/wallet', [WalletPageController::class, 'index'])->name('account.wallet');

    Route::get('/account/wallet/transactions', [WalletPageController::class, 'index'])->name('account.wallet-transactions');

    // Deposit/withdraw live in the wallet page modals.
    Route::redirect('/account/wallet/deposit', '/account/wallet', 301)->name('account.wallet-deposit');

    Route::redirect('/account/wallet/withdraw', '/account/wallet', 301)->name('account.wallet-withdraw');

    Route::get('/account/kyc', function () {
        return inertia('kyc/Submit');
    })->name('account.kyc');

    Route::get('/account/payment-methods', function () {
        return inertia('account/PaymentMethods');
    })->name('account.payment-methods');

    Route::get('/account/financial-services', function () {
        return inertia('account/FinancialServices');
    })->name('account.financial-services');

    Route::get('/account/support', function () {
        return inertia('tickets/Index');
    })->name('account.support');

    Route::get('/account/support/create', function () {
        return inertia('tickets/Create');
    })->name('account.support-create');

    Route::get('/account/support/{id}', [TicketsPageController::class, 'show'])->name('account.support-show');

    Route::get('/account/settings', [SettingsPageController::class, 'index'])->name('account.settings');

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
    Route::get('/bills', function () {
        return inertia('bills/Index');
    })->name('bills.index');
    Route::get('/wallet/transactions/{id}', function (string $id) {
        return inertia('wallet/Transaction', ['transaction_id' => $id]);
    })->name('wallet.transaction');
    Route::get('/kyc', function () {
        return inertia('kyc/Submit');
    })->name('kyc.submit');
    Route::get('/orders', [OrdersPageController::class, 'index'])->name('orders.index');
    Route::get('/orders/checkout', [CheckoutPageController::class, 'index'])->name('orders.checkout');
    Route::get('/orders/returns', function () {
        return inertia('orders/Returns');
    })->name('orders.returns');
    Route::get('/orders/disputes', function () {
        return inertia('orders/Disputes');
    })->name('orders.disputes');
    Route::get('/orders/{id}', [OrdersPageController::class, 'show'])->name('orders.show');
    Route::get('/orders/{id}/tracking', function ($id) {
        return inertia('orders/Tracking', ['order_id' => $id]);
    })->name('orders.tracking');

    // Legacy /tickets URLs render the same pages as the spec-62
    // /account/support paths (pinned WaveA test requires /tickets to render).
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

// Spec phase 20: product/barcode/QR scan entry point (ScanPage, manual
// code lookup + camera QR decode - never a dead button).
Route::get('/scan', function () {
    return inertia('scan/Index');
})->name('scan.index');

Route::get('/forms/{slug}', function (string $slug) {
    $form = \Modules\Admin\Entities\CmsForm::where('slug', $slug)
        ->where('status', 'published')
        ->firstOrFail();

    return inertia('forms/Show', [
        'form' => [
            'name' => $form->name,
            'slug' => $form->slug,
            'fields' => collect($form->fields ?? [])
                ->filter(fn (array $field) => ($field['visibility'] ?? 'public') !== 'hidden')
                ->values()
                ->all(),
        ],
    ]);
})->name('forms.show');

// ─── Public Inertia pages ─────────────────────────────────────────────────────
Route::get('/home', [HomePageController::class, 'index'])->name('home.index');
Route::get('/products/compare', function () {
    return inertia('products/Compare');
})->name('products.compare');
// Recently Viewed trail (Home rebuild): localStorage-backed public page.
Route::get('/recently-viewed', function () {
    return inertia('products/RecentlyViewed');
})->name('recently-viewed.index');
Route::get('/products', [ProductsPageController::class, 'index'])->name('products.index');
Route::get('/products/{slug}/reviews', [ProductsPageController::class, 'reviews'])->name('products.reviews');
Route::get('/products/{slug}/vendor', [ProductsPageController::class, 'vendor'])->name('products.vendor');
Route::get('/products/{slug}', [ProductsPageController::class, 'show'])->name('products.show');

Route::get('/jobs', [JobsPageController::class, 'index'])->name('jobs.index');

// N-32 public company profile (literal segment, no /jobs/{id} conflict)
Route::get('/companies/{slug}', function (string $slug) {
    return inertia('companies/Show', ['company_slug' => $slug]);
})->name('companies.show');

Route::middleware('auth')->group(function () {
    Route::get('/jobs/applications', function () {
        return inertia('jobs/Applications');
    })->name('jobs.applications');

    Route::get('/jobs/applications/{id}', function (string $id) {
        return inertia('jobs/ApplicationDetail', ['application_id' => $id]);
    })->name('jobs.applications.show');

    Route::get('/jobs/create', function () {
        return inertia('jobs/Create');
    })->name('jobs.create');

    Route::get('/jobs/my-jobs', function () {
        return inertia('jobs/MyJobs');
    })->name('jobs.my-jobs');

    // N-32 manage your own company profile
    Route::get('/jobs/company', function () {
        return inertia('jobs/Company');
    })->name('jobs.company');

    Route::get('/jobs/profile', function () {
        return inertia('jobs/Profile');
    })->name('jobs.profile');

    Route::get('/jobs/{id}/apply', [JobsPageController::class, 'apply'])->name('jobs.apply');

    // N-33 poster-facing applicant pipeline (before /jobs/{id})
    Route::get('/jobs/{id}/applicants', function (string $id) {
        return inertia('jobs/JobApplicants', ['job_id' => $id]);
    })->name('jobs.applicants');
});

Route::get('/jobs/search', function () {
    return inertia('jobs/Search');
})->name('jobs.search');

Route::get('/jobs/{id}', [JobsPageController::class, 'show'])->name('jobs.show');

Route::middleware('auth')->group(function () {
    Route::get('/food/orders/{id}', function () {
        return inertia('food/OrderTracking');
    })->name('food.order-tracking');

    // Checkout is completed inline from the pharmacy cart.
    Route::redirect('/pharmacy/checkout', '/pharmacy/cart', 301)->name('pharmacy.checkout');

    Route::get('/pharmacy/orders/{id}', function () {
        return inertia('pharmacy/OrderTracking');
    })->name('pharmacy.order-tracking');

    Route::get('/pharmacy/orders/{id}/confirmation', function () {
        return inertia('pharmacy/OrderConfirmation');
    })->name('pharmacy.order-confirmation');
});

Route::get('/hotels', [HotelsPageController::class, 'index'])->name('hotels.index');
Route::middleware('auth')->group(function () {
    Route::get('/hotels/reservations', function () {
        return inertia('hotels/Reservations');
    })->name('hotels.reservations');

    Route::get('/hotels/bookings', function () {
        return inertia('hotels/Reservations');
    })->name('hotels.bookings');

    Route::get('/hotels/bookings/{id}', function (string $id) {
        return inertia('hotels/ReservationDetail', ['reservation_id' => $id]);
    })->name('hotels.booking-detail');
});
Route::get('/hotels/{id}/rooms/{roomId}', function ($id, $roomId) {
    return inertia('hotels/RoomDetails', ['hotel_id' => $id, 'room_id' => $roomId]);
})->name('hotels.room');
Route::get('/hotels/{id}', [HotelsPageController::class, 'show'])->name('hotels.show');
Route::get('/hotels/{id}/book', [HotelsPageController::class, 'booking'])->name('hotels.booking');

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
Route::get('/vendors/{slug}/products', [VendorsPageController::class, 'products'])->name('vendors.products');
Route::get('/vendors/{slug}/services', [VendorsPageController::class, 'services'])->name('vendors.services');
Route::get('/vendors/{slug}/reviews', [VendorsPageController::class, 'reviews'])->name('vendors.reviews');
Route::get('/vendors/{slug}', [VendorsPageController::class, 'show'])->name('vendors.show');

Route::get('/needs/history', function () {
    return inertia('needs/History');
})->name('needs.history')->middleware('auth');
Route::get('/needs/requests/{id}', function ($id) {
    return inertia('needs/Show', ['need_id' => $id]);
})->name('needs.show')->middleware('auth');
Route::get('/needs', [\App\Http\Controllers\Web\NeedsPageController::class, 'index'])->name('needs.index');

// N-29 cost guides (public discovery content)
Route::get('/needs/cost-guides', function () {
    return inertia('needs/CostGuides');
})->name('needs.cost-guides');
Route::get('/needs/cost-guides/{slug}', function (string $slug) {
    return inertia('needs/CostGuide', ['slug' => $slug]);
})->name('needs.cost-guides.show');

Route::middleware('auth')->group(function () {
    Route::get('/needs/request', function () {
        return inertia('needs/Request');
    })->name('needs.request');
    // Spec S11 canonical submit URI (/needs/request stays as an alias).
    Route::get('/needs/create', function () {
        return inertia('needs/Request');
    })->name('needs.create');

    // Spec S14 - my needs pages (registered before needs/{slug}).
    Route::get('/needs/my-needs', function () {
        return inertia('needs/MyNeeds');
    })->name('needs.my-needs');
    Route::get('/needs/my-needs/{id}/offers', function ($id) {
        return inertia('needs/my/Offers', ['need_id' => $id]);
    })->name('needs.my-needs.offers');
    Route::get('/needs/my-needs/{id}/messages', function ($id) {
        return inertia('needs/my/Messages', ['need_id' => $id]);
    })->name('needs.my-needs.messages');
    Route::get('/needs/my-needs/{id}/payment', function ($id) {
        return inertia('needs/my/Payment', ['need_id' => $id]);
    })->name('needs.my-needs.payment');
    Route::get('/needs/my-needs/{id}/tracking', function ($id) {
        return inertia('needs/my/Tracking', ['need_id' => $id]);
    })->name('needs.my-needs.tracking');
    Route::get('/needs/my-needs/{id}/review', function ($id) {
        return inertia('needs/my/Review', ['need_id' => $id]);
    })->name('needs.my-needs.review');
    Route::get('/needs/my-needs/{id}', function ($id) {
        return inertia('needs/my/Overview', ['need_id' => $id]);
    })->name('needs.my-needs.show');
});

// Spec S12 - canonical need detail (legacy /needs/requests/{id} stays).
Route::get('/needs/{category}/{id}', function ($category, $id) {
    return inertia('needs/Show', ['need_id' => $id, 'category_slug' => $category]);
})->name('needs.detail')->middleware('auth');

Route::get('/needs/{slug}', [\App\Http\Controllers\Web\NeedsPageController::class, 'category'])
    ->name('needs.category');

Route::get('/learn/courses', function () {
    return inertia('learn/Catalog');
})->name('learn.catalog');

// Canonical course URL is /learn/{id} (spec 16 lists /learn/courses/{id}).
Route::get('/learn/courses/{id}', function (string $id) {
    return redirect()->route('learn.show', ['id' => $id], 301);
})->where('id', '[^/]+')->name('learn.course-canonical');

Route::get('/learn/categories', function () {
    return inertia('learn/Categories');
})->name('learn.categories');

    Route::get('/learn/categories/{slug}', function (string $slug) {
        $name = ucwords(str_replace(['-', '_'], ' ', $slug));

        return inertia('learn/Category', [
            'category_slug' => $slug,
            'seo' => [
                'title' => "Courses in {$name}",
                'description' => "Browse published courses in the {$name} category on EverythingNeed Learn.",
                'canonical' => route('learn.category', ['slug' => $slug]),
                'robots' => 'index,follow',
            ],
        ]);
    })->name('learn.category');

Route::get('/learn/instructors', function () {
    return inertia('learn/Instructors');
})->name('learn.instructors');

// Phase 16 community feed (approved posts public; submit/like/comment need auth in-page).
Route::get('/learn/feed', function () {
    return inertia('learn/Feed');
})->name('learn.feed');

// Learn 2.0: single knowledge post (video watch page + discussion thread).
Route::get('/learn/watch/{id}', function (string $id) {
    return inertia('learn/Watch', ['post_id' => $id]);
})->where('id', '[^/]+')->name('learn.watch');

Route::get('/learn/search', function () {
    return inertia('learn/Search');
})->name('learn.search');

// Learn playlists: personal saved collections of approved knowledge posts.
Route::get('/learn/playlists', function () {
    return inertia('learn/Playlists');
})->name('learn.playlists');
    Route::get('/learn/instructors/{id}', function ($id) {
        $id = (string) $id;
        $name = urldecode($id);
        $course = \Modules\Learn\Entities\Course::where('instructor_name', 'ilike', $name)->first();
        if ($course === null && \Illuminate\Support\Str::isUuid($id)) {
            $course = \Modules\Learn\Entities\Course::where('id', $id)->first();
        }
        $fullName = $course?->instructor_name;
        if ($fullName === null && \Illuminate\Support\Str::isUuid($id)) {
            $fullName = \App\Models\User::whereKey($id)->value('name');
        }

        return inertia('learn/InstructorProfile', [
            'instructor_id' => $id,
            'seo' => $fullName
                ? [
                    'title' => "{$fullName} — Instructor",
                    'description' => "Browse courses and students taught by {$fullName} on EverythingNeed Learn.",
                    'canonical' => route('learn.instructor', ['id' => $id]),
                    'robots' => 'index,follow',
                ]
                : [
                    'title' => 'Instructor',
                    'description' => 'Instructor profile on EverythingNeed Learn.',
                    'canonical' => route('learn.instructor', ['id' => $id]),
                    'robots' => 'noindex,follow',
                ],
        ]);
    })->name('learn.instructor');
Route::get('/learn/quiz-results', function () {
    return inertia('learn/QuizResults');
})->name('learn.quiz-results')->middleware('auth');
Route::get('/learn', [LearnPageController::class, 'index'])->name('learn.index');

Route::middleware('auth')->group(function () {
    Route::get('/learn/my-learning', function () {
        return inertia('learn/MyLearning');
    })->name('learn.my-learning');

    Route::get('/learn/certificates', function () {
        return inertia('learn/Certificates');
    })->name('learn.certificates');

    Route::get('/learn/courses/{courseId}/lessons/{lessonId}', [LearnPageController::class, 'lesson'])->name('learn.lesson');

    Route::get('/learn/courses/{courseId}/quiz', [LearnPageController::class, 'quiz'])->name('learn.quiz');

    Route::get('/learn/courses/{courseId}/quiz/{quizId}', [LearnPageController::class, 'quizById'])->name('learn.quiz-detail');

    Route::get('/learn/progress', function () {
        return inertia('learn/Progress');
    })->name('learn.progress');

    Route::get('/learn/certificates/{id}', function (string $id) {
        return inertia('learn/CertificateDetail', ['certificate_id' => $id]);
    })->name('learn.certificate');
});

Route::get('/learn/{id}', [LearnPageController::class, 'show'])->name('learn.show');

Route::get('/certificates/verify/{code}', function (string $code) {
    return inertia('learn/VerifyCertificate', ['code' => $code]);
})->name('certificates.verify');

Route::get('/properties/create', function () {
    return inertia('properties/Create');
})->name('properties.create')->middleware('auth');

Route::get('/real-estate', [PropertiesPageController::class, 'index'])->name('real-estate.index');

Route::get('/real-estate/create', function () {
    return inertia('properties/Create');
})->name('real-estate.create')->middleware('auth');

Route::get('/real-estate/my-listings', function () {
    return inertia('properties/MyListings');
})->name('real-estate.my-listings')->middleware('auth');

Route::get('/real-estate/{id}', [PropertiesPageController::class, 'show'])->name('real-estate.show');
// Same inquiry flow under the canonical prefix (Show links here).
Route::get('/real-estate/{id}/inquiry', function ($id) {
    return inertia('properties/Inquiry', ['property_id' => $id]);
})->name('real-estate.inquiry');
Route::get('/properties/{id}/inquiry', function ($id) {
    return inertia('properties/Inquiry', ['property_id' => $id]);
})->name('properties.inquiry');

// Plan: add /properties/my-listings alias (same component + API as /real-estate/my-listings)
Route::get('/properties/my-listings', function () {
    return inertia('properties/MyListings');
})->name('properties.my-listings')->middleware('auth');

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

Route::get('/healthcare/tickets', function () {
    return inertia('healthcare/MyHealthTickets');
})->name('healthcare.tickets')->middleware('auth');
    Route::get('/healthcare/labs', function () {
        return inertia('healthcare/Labs');
    })->name('healthcare.labs');
    Route::get('/healthcare/videos', function () {
        return inertia('healthcare/Content', ['kind' => 'videos']);
    })->name('healthcare.videos');
    Route::get('/healthcare/documents', function () {
        return inertia('healthcare/Documentation');
    })->name('healthcare.documents');
    Route::get('/healthcare/guides', function () {
        return inertia('healthcare/Content', ['kind' => 'guides']);
    })->name('healthcare.guides');
Route::get('/healthcare/labs/{id}/book', function ($id) {
    return inertia('healthcare/LabBooking', ['test_id' => $id]);
})->name('healthcare.lab-book')->middleware('auth');
Route::get('/healthcare/lab-confirmation', function () {
    return inertia('healthcare/BookingConfirmation');
})->name('healthcare.lab-confirmation')->middleware('auth');

Route::get('/healthcare/doctors', function () {
    return inertia('healthcare/Doctors');
})->name('healthcare.doctors');

Route::get('/healthcare/doctors/{id}', [HealthcarePageController::class, 'doctorProfile'])->name('healthcare.doctor');

Route::get('/healthcare/doctors/{id}/profile', [HealthcarePageController::class, 'doctorProfile'])->name('healthcare.doctor-profile');

Route::get('/healthcare/doctors/{id}/availability', function (string $id) {
    return inertia('healthcare/DoctorAvailability', ['doctor_id' => $id]);
})->name('healthcare.doctor-availability');

Route::get('/healthcare/doctors/{id}/reviews', function (string $id) {
    return inertia('healthcare/DoctorReviews', ['doctor_id' => $id]);
})->name('healthcare.doctor-reviews');

Route::get('/healthcare/labs/bookings', function () {
    return inertia('healthcare/LabBookings');
})->name('healthcare.lab-bookings')->middleware('auth');

Route::get('/healthcare/labs/bookings/{id}', function (string $id) {
    return inertia('healthcare/LabBookingDetail', ['booking_id' => $id]);
})->name('healthcare.lab-booking')->middleware('auth');

Route::get('/healthcare/labs/{id}', function (string $id) {
    return inertia('healthcare/LabShow', ['test_id' => $id]);
})->name('healthcare.lab');

Route::get('/healthcare/pharmacy', function () {
    return inertia('pharmacy/Index');
})->name('healthcare.pharmacy');

Route::get('/healthcare/pharmacy/products', function () {
    return inertia('pharmacy/Index');
})->name('healthcare.pharmacy-products');

Route::get('/healthcare/pharmacy/products/{id}', function (string $id) {
    return inertia('pharmacy/Show', ['product_id' => $id]);
})->name('healthcare.pharmacy-product');

Route::get('/healthcare/health-services', function () {
    return inertia('healthcare/HealthServices');
})->name('healthcare.health-services');

Route::get('/healthcare/providers', function () {
    return inertia('healthcare/Providers');
})->name('healthcare.providers');

Route::get('/healthcare/providers/{id}', function (string $id) {
    return inertia('healthcare/ProviderDetail', ['provider_id' => $id]);
})->name('healthcare.provider');

Route::get('/healthcare/search', function () {
    return inertia('healthcare/Search');
})->name('healthcare.search');

Route::redirect('/healthcare/specialty/{specialty}', '/healthcare/doctors', 301)->name('healthcare.specialty');

// H-C: Aid / Charity - public listing + detail + requester surfaces.
// "mine" must precede /{id} so it is not swallowed by the uuid route.
Route::get('/healthcare/aid', function () {
    return inertia('healthcare/Aid');
})->name('healthcare.aid');

Route::get('/healthcare/aid/mine', function () {
    return inertia('healthcare/MyAid');
})->name('healthcare.aid.mine')->middleware('auth');

Route::get('/healthcare/aid/{id}', function (string $id) {
    return inertia('healthcare/AidDetail', ['aid_id' => $id]);
})->where('id', '[0-9a-f-]{36}')->name('healthcare.aid.show');

Route::get('/experts', function () {
    return inertia('experts/Index');
})->name('experts.index');

// Static paths must precede /experts/{id} so they are not swallowed.
Route::get('/experts/bookings', function () {
    return inertia('experts/Bookings');
})->name('experts.bookings')->middleware('auth');

Route::get('/experts/{id}/book', function ($id) {
    return inertia('experts/Book', ['expert_id' => $id]);
})->name('experts.book');

Route::get('/experts/{id}', function ($id) {
    return inertia('experts/Show', ['expert_id' => $id]);
})->name('experts.show');

Route::get('/deals', function () {
    return inertia('deals/Index');
})->name('deals.index');

// Spec §9: deals filtered by deal category slug.
Route::get('/deals/category/{slug}', function ($slug) {
    $category = \Modules\Needs\Entities\NeedCategory::where('slug', $slug)->firstOrFail();

    return inertia('deals/Category', ['category' => $category]);
})->name('deals.category');

// Gold vertical landings — specific slugs before generic {id} show route.
Route::get('/deals/{slug}', function ($slug) {
    return inertia('deals/Landing', ['slug' => $slug]);
})->whereIn('slug', [
    'food', 'jobs', 'hotels', 'real-estate', 'tasks', 'transportation', 'agriculture', 'booking',
])->name('deals.landing');

// Spec §9: /deals/{slug} resolves a deal by canonical slug; legacy /deals/{id}
// links 301 to the slug URL. Vertical landings (above) keep precedence.
Route::get('/deals/{id}', function ($id) {
    $deal = \Modules\Needs\Entities\NeedItem::where('slug', $id)->first();

    if ($deal) {
        return inertia('deals/Show', ['deal_id' => $deal->id]);
    }

    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
        $legacy = \Modules\Needs\Entities\NeedItem::find($id);
        if ($legacy) {
            return redirect()->route('deals.show', $legacy->slug, 301);
        }
    }

    abort(404);
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

// Spec §9: canonical category URL by slug; legacy /categories/{id} 301s.
Route::get('/categories/{key}', function ($key) {
    $category = \Modules\Categories\Entities\Category::where('slug', $key)
        ->when(
            preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $key),
            fn ($query) => $query->orWhere('id', $key)
        )
        ->firstOrFail();

    if ($category->slug !== $key) {
        return redirect()->route('categories.show', $category->slug, 301);
    }

    return inertia('categories/Show', ['category_id' => $category->slug]);
})->name('categories.show');

Route::get('/payments', function () {
    return inertia('payments/Index');
})->name('payments.index');

// Customer "My Analytics" — personal stats; guests go to login first
// (the page's API calls require an authenticated session).
Route::get('/analytics', function () {
    return inertia('analytics/Index');
})->name('analytics.index')->middleware('auth');

// Legacy standalone viewer - the matrix lives in the admin console now.
Route::redirect('/permissions', '/admin/rbac', 301)->name('permissions.index')->middleware('role:super_admin,administrator');

Route::get('/deliveries', function () {
    return inertia('deliveries/Index');
})->name('deliveries.index');

Route::get('/inventory', function () {
    return inertia('inventory/Index');
})->name('inventory.index');

Route::get('/pharmacy', function () {
    return inertia('pharmacy/Index');
})->name('pharmacy.index');

Route::get('/pharmacy/products/{id}', function (string $id) {
    return inertia('pharmacy/Show', ['product_id' => $id]);
})->name('pharmacy.product');

Route::get('/pharmacy/cart', function () {
    return inertia('pharmacy/Cart');
})->name('pharmacy.cart');

Route::middleware('auth')->group(function () {
Route::get('/healthcare/doctors/{id}/book', [HealthcarePageController::class, 'book'])->name('healthcare.book');

});

// ─── Job Seekers (Inertia deep pages) ─────────────────────────────────────────
Route::get('/job-seekers', [JobSeekersPageController::class, 'index'])->name('job-seekers.index');
Route::middleware('auth')->group(function () {
    Route::get('/job-seekers/my-requests', [JobSeekersPageController::class, 'myRequests'])->name('job-seekers.my-requests');
    Route::get('/job-seekers/request/{worker}', [JobSeekersPageController::class, 'createRequest'])->name('job-seekers.request');
});
Route::get('/job-seekers/{id}', [JobSeekersPageController::class, 'show'])->name('job-seekers.show');

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
// Evidence is submitted inline on the task page now.
Route::redirect('/tasks/{id}/submit', '/tasks/{id}', 301)->name('tasks.submit')->middleware('auth');
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

    // Spec §34 vendor system page set.
    Route::get('/vendor/dashboard', [VendorPortalPageController::class, 'dashboard']);
    Route::get('/vendor/profile', function () {
        return inertia('vendor/Profile');
    })->name('vendor.profile');
    Route::get('/vendor/services/create', function () {
        return inertia('vendor/ServiceCreate');
    })->name('vendor.services.create');
    Route::get('/vendor/services/{id}/edit', function ($id) {
        return inertia('vendor/ServiceEdit', ['service_id' => $id]);
    })->name('vendor.services.edit');
    Route::get('/vendor/services', function () {
        return inertia('vendor/Services');
    })->name('vendor.services');
    Route::get('/vendor/bookings', function () {
        return inertia('vendor/Bookings');
    })->name('vendor.bookings');
    Route::get('/vendor/reviews', function () {
        return inertia('vendor/Reviews');
    })->name('vendor.reviews');
    Route::get('/vendor/earnings', function () {
        return inertia('vendor/Earnings');
    })->name('vendor.earnings');
    Route::get('/vendor/settings', function () {
        return inertia('vendor/Settings');
    })->name('vendor.settings');

    Route::get('/healthcare/appointments', [HealthcarePageController::class, 'appointments'])->name('healthcare.appointments');
    Route::get('/healthcare/prescriptions', [HealthcarePageController::class, 'prescriptions'])->name('healthcare.prescriptions');
    Route::get('/healthcare/records', [HealthcarePageController::class, 'records'])->name('healthcare.records');
    Route::get('/healthcare/appointments/{id}', [HealthcarePageController::class, 'appointmentDetail'])->name('healthcare.appointment.show');
    // H-D: Health Bookings hub (all bookable healthcare services) +
    // home-visit and custom-request ("Others") booking pages.
    Route::get('/healthcare/bookings', [HealthcarePageController::class, 'bookings'])->name('healthcare.bookings');
    Route::get('/healthcare/bookings/home-visit', function () {
        return inertia('healthcare/HomeVisit');
    })->name('healthcare.bookings.home-visit');
    Route::get('/healthcare/bookings/others', function () {
        return inertia('healthcare/ServiceRequests');
    })->name('healthcare.bookings.others');

    Route::get('/requests', [ServiceRequestsPageController::class, 'requests'])->name('requests.index');
});

// ─── Transportation (Inertia) ─────────────────────────────────────────────────
Route::get('/transportation', function () {
    return inertia('transportation/Index');
})->name('transportation.index');
Route::get('/transportation/ride-booking', function () {
return inertia('transportation/RideBooking');
})->name('transportation.ride-booking')->middleware('auth');
// Driver lifecycle console (register, availability, accept/complete rides)
Route::get('/transportation/driver', function () {
    return inertia('transportation/Driver');
})->name('transportation.driver')->middleware('auth');
// N-39 driver earnings view
Route::get('/transportation/driver/earnings', function () {
return inertia('transportation/DriverEarnings');
})->name('transportation.driver.earnings')->middleware('auth');
Route::get('/transportation/tracking/{id}', function ($id) {
    return inertia('transportation/RideTracking', ['ride_id' => $id]);
})->name('transportation.tracking')->middleware('auth');
Route::get('/transportation/custom-request', function () {
    return inertia('transportation/CustomRequest');
})->name('transportation.custom-request')->middleware('auth');

// ─── Building Services deep (Inertia) ───────────────────────────────────────
Route::get('/building-services/book', function () {
    return inertia('building-services/Booking', ['worker_id' => request()->query('worker')]);
})->name('building-services.book')->middleware('auth');
// Booking management lives on the building-services index page.
Route::redirect('/building-services/bookings', '/building-services', 301)->name('building-services.bookings')->middleware('auth');
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
Route::get('/agriculture/farmers', function () {
return inertia('agriculture/Farmers');
})->name('agriculture.farmers');
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

// ─── Public service catalogue (spec 39/100) ───────────────────────────────────
// Taxonomy grid (7 icons + See more) and bookable detail pages; the home
// services rail and category tiles link here.
Route::get('/services', [ServiceCatalogPageController::class, 'index'])->name('services.index');
Route::get('/services/{id}', [ServiceCatalogPageController::class, 'show'])->name('services.show');

// ─── Admin console (Inertia, role- or permission-gated) ───────────────────────
// Mirrors ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md: the dashboard is the common
// landing for every administrative role (cards filtered per role server-side)
// and for custom roles whose permissions open at least one console page;
// domain pages grant exactly their domain permission (or their role list).
// Server middleware is the only authority — the sidebar registry is UX.
Route::middleware('admin.access')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminPageController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/', [AdminPageController::class, 'dashboard'])->name('admin.root');
});

Route::middleware('permission:products.products.approve')->prefix('admin')->group(function () {
    Route::get('/approvals', [AdminPageController::class, 'approvals'])->name('admin.approvals');
});

// Categories (spec §65 Category Admin): split from /approvals so the
// category console does not implicitly reach product approvals.
Route::middleware('permission:categories.categories.view')->prefix('admin')->group(function () {
    Route::get('/categories', [AdminPageController::class, 'categories'])->name('admin.categories');
});

Route::middleware('permission:support.overview.view')->prefix('admin')->group(function () {
    Route::get('/departments', [AdminPageController::class, 'departments'])->name('admin.departments');
});

Route::middleware('permission:audit.logs.view')->prefix('admin')->group(function () {
    Route::get('/audit-logs', function () {
        return inertia('admin/AuditLogs');
    })->name('admin.audit-logs');
});

// RBAC console. The per-user permission editor APIs are gated by
// users.permissions.manage (Modules/Admin/Routes/api.php), so the page
// gate is the same permission: a holder of it (administrator, a custom
// role or a direct per-user grant) can open the console. The role
// management APIs stay super-admin-only.
Route::middleware('permission:users.permissions.manage')->prefix('admin')->group(function () {
    Route::get('/rbac', [AdminPageController::class, 'rbac'])->name('admin.rbac');
    Route::get('/roles', [AdminPageController::class, 'rbac'])->name('admin.roles');
});

// Settings + system health.
Route::middleware('permission:settings.system.update')->prefix('admin')->group(function () {
    Route::get('/system', function () {
        return inertia('admin/System');
    })->name('admin.system');
    Route::get('/settings', function () {
        return inertia('admin/AdminSettings');
    })->name('admin.settings');
});

Route::middleware('permission:users.users.manage')->prefix('admin')->group(function () {
    Route::get('/users', function () {
        return inertia('admin/Users');
    })->name('admin.users');
    Route::get('/users/{id}', [AdminDetailPageController::class, 'user'])->name('admin.users.show');
});

Route::middleware('permission:analytics.overview.view')->prefix('admin')->group(function () {
    Route::get('/analytics', function () {
        return inertia('admin/Analytics');
    })->name('admin.analytics');
});

// Reports — CSV export stays permission-gated on the API.
Route::middleware('permission:reports.reports.view')->prefix('admin')->group(function () {
    Route::get('/reports', function () {
        return inertia('admin/Reports');
    })->name('admin.reports');
});

// Vendors (spec §65 Vendor Manager) split from /products: the vendor
// console never implies product management.
Route::middleware('permission:vendors.vendors.view')->prefix('admin')->group(function () {
    Route::get('/vendors', function () {
        return inertia('admin/Vendors');
    })->name('admin.vendors');
    Route::get('/vendors/{id}', [AdminDetailPageController::class, 'vendor'])->name('admin.vendors.show');
});

Route::middleware('permission:products.products.manage')->prefix('admin')->group(function () {
    Route::get('/products', function () {
        return inertia('admin/Products');
    })->name('admin.products');
});

Route::middleware('permission:inventory.stock.view')->prefix('admin')->group(function () {
    Route::get('/inventory', function () {
        return inertia('admin/Inventory');
    })->name('admin.inventory');
});

Route::middleware('permission:orders.orders.view')->prefix('admin')->group(function () {
    Route::get('/orders', function () {
        return inertia('admin/Orders');
    })->name('admin.orders');
    Route::get('/orders/{id}', [AdminDetailPageController::class, 'order'])->name('admin.orders.show');
});

Route::middleware('permission:cms.pages.manage')->prefix('admin')->group(function () {
    Route::get('/cms', function () {
        return inertia('admin/Cms');
    })->name('admin.cms');
});

Route::middleware('permission:newsletter.subscriptions.view')->prefix('admin')->group(function () {
    Route::get('/newsletter', function () {
        return inertia('admin/Newsletter');
    })->name('admin.newsletter');
});

// Home page builder (Home rebuild): order/visibility console for the
// storefront sections. Same content roles as CMS; create/delete stay
// Super Admin-only on the API.
Route::middleware('permission:cms.home.view')->prefix('admin')->group(function () {
    Route::get('/home-sections', function () {
        return inertia('admin/HomeSections');
    })->name('admin.home-sections');
});

// Plan G4: no-code navigation menu manager.
Route::middleware('permission:navigation.view')->prefix('admin')->group(function () {
    Route::get('/navigation', function () {
        return inertia('admin/Navigation');
    })->name('admin.navigation');
});

// Media library (W1) — mirrors the AdminMediaController media.view gate.
Route::middleware('permission:media.view')->prefix('admin')->group(function () {
    Route::get('/media', function () {
        return inertia('admin/Media');
    })->name('admin.media');
});

// No-code dynamic modules (W3 / plan G5).
Route::middleware('permission:modules.view')->prefix('admin')->group(function () {
    Route::get('/modules', function () {
        return inertia('admin/Modules');
    })->name('admin.modules');
});

Route::middleware('permission:forms.view')->prefix('admin')->group(function () {
    Route::get('/forms', function () {
        return inertia('admin/Forms');
    })->name('admin.forms');
});

// Admin-defined service catalogue (spec 39/100).
Route::middleware('permission:services.overview.view')->prefix('admin')->group(function () {
    Route::get('/services', function () {
        return inertia('admin/Services');
    })->name('admin.services');
});

Route::middleware('permission:categories.categories.view')->prefix('admin')->group(function () {
    Route::get('/category', [AdminPageController::class, 'categories'])->name('admin.category');
});

Route::middleware('permission:brands.brands.view')->prefix('admin')->group(function () {
    Route::get('/brands', function () {
        return inertia('admin/Brands');
    })->name('admin.brands');
});

Route::middleware('permission:kyc.applications.view')->prefix('admin')->group(function () {
    Route::get('/kyc', function () {
        return inertia('admin/Kyc');
    })->name('admin.kyc');
});

Route::middleware('permission:hotels.overview.view')->prefix('admin')->group(function () {
    Route::get('/hotels', function () {
        return inertia('admin/Hotels');
    })->name('admin.hotels');
});

Route::middleware('permission:food.overview.view')->prefix('admin')->group(function () {
    Route::get('/food', function () {
        return inertia('admin/Food');
    })->name('admin.food');
});

Route::middleware('permission:agriculture.overview.view')->prefix('admin')->group(function () {
    Route::get('/agriculture', function () {
        return inertia('admin/Agriculture');
    })->name('admin.agriculture');
});

Route::middleware('permission:deals.deals.view')->prefix('admin')->group(function () {
    Route::get('/deals', function () {
        return inertia('admin/Deals');
    })->name('admin.deals');
});

Route::middleware('permission:messaging.overview.view')->prefix('admin')->group(function () {
    Route::get('/messaging', function () {
        return inertia('admin/Messaging');
    })->name('admin.messaging');
});

// Transport console. The page lists the rides + flights of the Rides
// module, so the gate carries the permission its own data API requires
// (rides.overview.view) next to the transport overview permission.
Route::middleware('permission:transport.overview.view,rides.overview.view')->prefix('admin')->group(function () {
    Route::get('/transport', function () {
        return inertia('admin/Transport');
    })->name('admin.transport');
});

// Jobs console. The applications tab reads /api/admin/job-applications
// (jobs.applications.view), so the page gate carries it next to the jobs
// overview permission.
Route::middleware('permission:jobs.overview.view,jobs.applications.view')->prefix('admin')->group(function () {
    Route::get('/jobs', function () {
        return inertia('admin/Jobs');
    })->name('admin.jobs');
});

// Job seekers console. The work-request tab reads /api/admin/work-requests
// (job_seekers.requests.manage), so the page gate carries it next to the
// job_seekers overview permission.
Route::middleware('permission:job_seekers.overview.view,job_seekers.requests.manage')->prefix('admin')->group(function () {
    Route::get('/job-seekers', function () {
        return inertia('admin/JobSeekers');
    })->name('admin.job-seekers');
});

Route::middleware('permission:finance.payouts.manage')->prefix('admin')->group(function () {
    Route::get('/payouts', function () {
        return inertia('admin/Payouts');
    })->name('admin.payouts');
    Route::get('/payouts/{id}', [AdminDetailPageController::class, 'payout'])->name('admin.payouts.show');
});

// Finance console. The page reads /api/admin/finance/summary and
// /api/admin/finance/transactions (finance.transactions.view), so the
// page gate carries that permission next to the finance overview one.
Route::middleware('permission:finance.overview.view,finance.transactions.view')->prefix('admin')->group(function () {
    Route::get('/finance', function () {
        return inertia('admin/Finance');
    })->name('admin.finance');
});

Route::middleware('permission:support.tickets.view')->prefix('admin')->group(function () {
    Route::get('/support/tickets', function () {
        return inertia('admin/Support');
    })->name('admin.support');

    Route::get('/support', function () {
        return inertia('admin/Support');
    })->name('admin.support-index');

    Route::get('/support/{id}', function (string $id) {
        return inertia('admin/SupportDetail', ['ticket_id' => $id]);
    })->name('admin.support-show');
});

Route::middleware('permission:healthcare.overview.view')->prefix('admin')->group(function () {
    Route::get('/healthcare/doctors', function () {
        return inertia('admin/Healthcare');
    })->name('admin.healthcare');
});

Route::middleware('permission:healthcare.aid.view')->prefix('admin')->group(function () {
    Route::get('/healthcare/aid', function () {
        return inertia('admin/HealthcareAid');
    })->name('admin.healthcare.aid');
});

// Spec 2682: granular permission is the only authority on every admin surface.
// The learning console lists the courses through /api/admin/courses
// (learn.courses.manage), so the page gate carries that permission next to
// the learn overview one.
Route::middleware('permission:learn.overview.view,learn.courses.manage')->prefix('admin')->group(function () {
    Route::get('/learning/courses', function () {
        return inertia('admin/Learning');
    })->name('admin.learning');
});

// Learn 2.0 moderation queue - reviewers approve/reject feed posts and videos.
Route::middleware('permission:learn.posts.review')->prefix('admin')->group(function () {
    Route::get('/learning/review', function () {
        return inertia('admin/LearnReview');
    })->name('admin.learning.review');
});

// ─── Domain consoles (tables from Phases/Modules) ─────────────────────────────

Route::middleware('permission:pharmacy.overview.view')->prefix('admin')->group(function () {
    Route::get('/pharmacy', function () {
        return inertia('admin/Pharmacy');
    })->name('admin.pharmacy');
});

Route::middleware('permission:building_services.overview.view')->prefix('admin')->group(function () {
    Route::get('/building', function () {
        return inertia('admin/Building');
    })->name('admin.building');
});

Route::middleware('permission:real_estate.overview.view')->prefix('admin')->group(function () {
    Route::get('/real-estate', function () {
        return inertia('admin/RealEstate');
    })->name('admin.real-estate');
});

Route::middleware('permission:needs.overview.view')->prefix('admin')->group(function () {
    Route::get('/needs', function () {
        return inertia('admin/Needs');
    })->name('admin.needs');
});

Route::middleware('permission:orders.orders.view')->prefix('admin')->group(function () {
    Route::get('/returns', function () {
        return inertia('admin/Returns');
    })->name('admin.returns');
});

Route::middleware('permission:reviews.reviews.moderate')->prefix('admin')->group(function () {
    Route::get('/reviews', function () {
        return inertia('admin/Reviews');
    })->name('admin.reviews');
});

Route::middleware('permission:subscriptions.subscriptions.view')->prefix('admin')->group(function () {
    Route::get('/subscriptions', function () {
        return inertia('admin/Subscriptions');
    })->name('admin.subscriptions');
});

Route::middleware('permission:notifications.overview.view')->prefix('admin')->group(function () {
    Route::get('/notifications', function () {
        return inertia('admin/Notifications');
    })->name('admin.notifications');
});

Route::middleware('permission:payments.payments.view')->prefix('admin')->group(function () {
    Route::get('/wallet', function () {
        return inertia('admin/Wallet');
    })->name('admin.wallet');
});

Route::middleware('permission:delivery.deliveries.view')->prefix('admin')->group(function () {
    Route::get('/deliveries', function () {
        return inertia('admin/Deliveries');
    })->name('admin.deliveries');
});

// ─── Provider/worker console (Inertia, role-gated) ────────────────────────────
Route::middleware('role:worker')->group(function () {
    Route::get('/provider', [ProviderPageController::class, 'dashboard'])->name('provider.dashboard');
});

// TODO 19 provider needs hub + onboarding: auth-only (needs providers are
// ordinary users, not necessarily `worker` role).
Route::middleware('auth')->group(function () {
    Route::get('/provider/needs', function () {
        return inertia('provider/NeedsHub');
    })->name('provider.needs');
    Route::get('/provider/profile', function () {
        return inertia('provider/Profile');
    })->name('provider.profile');
});

// ─── Signed-URL private attachments (backlog #2) ─────────────────────────────
// Signed stream endpoint for private files (dispute evidence, KYC docs).
// Registered before the catch-all so the signed path never 404s; the
// `signed` middleware rejects expired/foreign signatures up front.
Route::get('/signed-storage/stream', [\App\Http\Controllers\SignedStorageController::class, 'stream'])
    ->middleware('signed')
    ->name('signed.storage.stream');

// ─── Public no-code CMS pages (Wave C - spec S99: /p/{slug}) ─────────────────
// Registered BEFORE the catch-all so /p/{...} never falls through to 404.
Route::get('/p/{slug}', [CmsPageController::class, 'show'])
    ->where('slug', '[a-z0-9\-]+')
    ->name('cms.page');

// ─── Catch-all: Inertia 404 (no SPA redirect) ────────────────────────────────
Route::get('/{path}', function (string $path) {
    if (request()->expectsJson()) {
        abort(404);
    }

    // Unknown URLs must return HTTP 404 (spec: no soft-404 with 200 OK).
    // In-app Inertia visits keep the web contract (redirect back with the
    // not-found message) so client-side navigation never breaks.
    if (request()->header('X-Inertia')) {
        return redirect()->back()->with('error', 'The requested resource was not found.');
    }

    return inertia('errors/404')->toResponse(request())->setStatusCode(404);
// POST-only single-segment routes must stay outside the catch-all so Laravel
// returns a truthful 405 instead of the catch-all's 404 (spec: route audit).
})->where('path', '^(?!api|up|storage|sanctum|telescope|build|logout|reset-password).*$');
