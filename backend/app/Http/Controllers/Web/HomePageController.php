<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Categories\Entities\Category;
use Modules\Checkout\Entities\Cart;
use Modules\Food\Entities\Restaurant;
use Modules\Healthcare\Entities\Doctor;
use Modules\Hotels\Entities\Hotel;
use Modules\Jobs\Entities\JobPost;
use Modules\Learn\Entities\Course;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\TaskPost;
use Modules\Products\Entities\Product;
use Modules\RealEstate\Entities\Property;
use Modules\Rides\Entities\Flight;
use Modules\Vendors\Entities\Vendor;

class HomePageController extends Controller
{
    /**
     * `/` (spec S8): guests and marketplace customers land on Home;
     * console roles (admin/vendor/provider) keep their role landing.
     */
    public function root(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user !== null) {
            $landing = app(\Core\Services\Contracts\WorkspaceResolverInterface::class)->landingPath($user);
            $defaultLanding = (string) config('workspace.default_landing', '/dashboard');

            if ($landing !== $defaultLanding) {
                return redirect()->to($landing);
            }
        }

        return Inertia::render('Home/Index', $this->marketplaceData());
    }

    public function index(Request $request): Response
    {
        return Inertia::render('Home/Index', $this->marketplaceData());
    }

    public function dashboard(Request $request): Response
    {
        return Inertia::render('Dashboard', $this->marketplaceData());
    }

    /**
     * Shared marketplace payload: products, per-type spotlight cards with
     * explicit links, categories, cross-section experts, cart count, and
     * the Home sections payload (spec S8 sections 4/11-24).
     */
    private function marketplaceData(): array
    {
        // Gap 5: denser discovery grid (24/page) with page-based load-more so
        // the home feed surfaces more real inventory without a full reload.
        $products = Product::with('vendor:id,store_name')
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'originalPrice' => $product->compare_price !== null ? (float) $product->compare_price : null,
                'rating' => $product->rating !== null ? (float) $product->rating : null,
                'image' => $product->image_url ?? ($product->images[0] ?? null),
                'category' => $product->category,
                'vendor' => $product->vendor->store_name ?? null,
                'type' => 'product',
                'link' => "/products/{$product->id}",
            ]);

        $categories = Category::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'icon']);

        return [
            'products' => $products,
            'categories' => $categories,
            'learning' => $this->learningCards(),
            'healthcareCards' => $this->healthcareCards(),
            'topExperts' => $this->topExperts(),
            'cartCount' => $this->cartCount(),
            'sections' => $this->sections(),
        ];
    }

    /**
     * Home vertical sections payload (spec S8). Every key is always
     * present; a section with no real rows carries an empty list and the
     * frontend hides it - never fabricates placeholder content.
     *
     * Sections 1-3 (header/search/hero), 5-7 (promos), 8-9 (categories),
     * 10 (submit need), 14 (healthcare), 15 (experts), 23 (learn), 25
     * (discovery) are rendered from layout components, shared props or
     * uiTexts, so they need no payload here.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    private function sections(): array
    {
        return [
            'dailyDeals' => $this->dailyDeals(),
            'featured' => $this->featuredProducts(),
            'deals' => $this->dealCards(),
            'services' => $this->serviceCards(),
            'jobs' => $this->jobCards(),
            'hotels' => $this->hotelCards(),
            'transportation' => $this->flightCards(),
            'food' => $this->restaurantCards(),
            'agriculture' => $this->agricultureCards(),
            'realEstate' => $this->propertyCards(),
            'buildingServices' => $this->workerCards(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function dailyDeals(): array
    {
        try {
            return Product::where('is_active', true)
                ->whereNotNull('compare_price')
                ->whereColumn('compare_price', '>', 'price')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Product $product) => $this->productCard($product, 'Deal'))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function featuredProducts(): array
    {
        try {
            return Product::where('is_active', true)
                ->orderByRaw('COALESCE(rating, 0) DESC')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Product $product) => $this->productCard($product))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function dealCards(): array
    {
        try {
            return NeedItem::where('is_available', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (NeedItem $deal) => [
                    'id' => $deal->id,
                    'title' => $deal->name,
                    'subtitle' => \Illuminate\Support\Str::limit((string) $deal->description, 80),
                    'image' => $deal->image_url,
                    'url' => "/deals/{$deal->id}",
                    'badge' => 'Deal',
                    'price' => $deal->price !== null ? (float) $deal->price : null,
                    'rating' => null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Bookable service definitions (spec 100) lead the Services rail, topped
     * up with open task/gig posts so the section never looks thin when only a
     * few services are live. Real rows only - never placeholder content.
     *
     * @return list<array<string, mixed>>
     */
    private function serviceCards(): array
    {
        $cards = [];

        try {
            $definitions = \Modules\Services\Entities\ServiceDefinition::where('status', 'active')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get();

            foreach ($definitions as $service) {
                $cards[] = [
                    'id' => $service->id,
                    'title' => $service->name,
                    'subtitle' => trim(
                        ($service->category ?? '') .
                        ($service->location !== null ? ' · ' . $service->location : '')
                    ),
                    'image' => $service->image_url,
                    'url' => "/services/{$service->id}",
                    'badge' => $service->requires_booking ? 'Bookable' : 'Service',
                    'price' => $service->base_price !== null ? (float) $service->base_price : null,
                    'rating' => null,
                ];
            }
        } catch (\Throwable) {
            // table may be missing on a fresh install
        }

        // Top up with open tasks so the rail reflects the real Tasks vertical.
        if (count($cards) < 6) {
            try {
                $tasks = TaskPost::where('status', TaskPost::STATUS_OPEN)
                    ->orderByDesc('created_at')
                    ->limit(6 - count($cards))
                    ->get();

                foreach ($tasks as $task) {
                    $cards[] = [
                        'id' => $task->id,
                        'title' => $task->title,
                        'subtitle' => \Illuminate\Support\Str::limit((string) $task->description, 80),
                        'image' => null,
                        'url' => "/tasks/{$task->id}",
                        'badge' => 'Task',
                        'price' => $task->budget !== null ? (float) $task->budget : null,
                        'rating' => null,
                    ];
                }
            } catch (\Throwable) {
            }
        }

        return $cards;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jobCards(): array
    {
        try {
            return JobPost::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (JobPost $job) => [
                    'id' => $job->id,
                    'title' => $job->title,
                    'subtitle' => trim(($job->company ?? '') . ($job->location !== null ? ' · ' . $job->location : '')),
                    'image' => null,
                    'url' => "/jobs/{$job->id}",
                    'badge' => $job->job_type,
                    'price' => null,
                    'rating' => null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function hotelCards(): array
    {
        try {
            return Hotel::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Hotel $hotel) => [
                    'id' => $hotel->id,
                    'title' => $hotel->name,
                    'subtitle' => $hotel->city,
                    'image' => $hotel->image_url,
                    'url' => "/hotels/{$hotel->id}",
                    'badge' => $hotel->star_rating !== null ? "{$hotel->star_rating}-star" : null,
                    'price' => null,
                    'rating' => null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function flightCards(): array
    {
        try {
            return Flight::where('is_active', true)
                ->orderByDesc('departure_time')
                ->limit(6)
                ->get()
                ->map(fn (Flight $flight) => [
                    'id' => $flight->id,
                    'title' => $flight->airline,
                    'subtitle' => trim($flight->origin_code . ' → ' . $flight->destination_code),
                    'image' => null,
                    'url' => "/flights/{$flight->id}",
                    'badge' => $flight->flight_number,
                    'price' => $flight->price !== null ? (float) $flight->price : null,
                    'rating' => null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function restaurantCards(): array
    {
        try {
            return Restaurant::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Restaurant $restaurant) => [
                    'id' => $restaurant->id,
                    'title' => $restaurant->name,
                    'subtitle' => $restaurant->cuisine_type,
                    'image' => $restaurant->image_url,
                    'url' => "/food/{$restaurant->id}",
                    'badge' => null,
                    'price' => null,
                    'rating' => $restaurant->rating !== null ? (float) $restaurant->rating : null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function agricultureCards(): array
    {
        try {
            return Product::where('is_active', true)
                ->where('category', 'ilike', '%agric%')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Product $product) => $this->productCard($product, 'Agriculture'))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function propertyCards(): array
    {
        try {
            return Property::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Property $property) => [
                    'id' => $property->id,
                    'title' => $property->title,
                    'subtitle' => trim(
                        ($property->property_type ?? '') .
                        ($property->city !== null ? ' · ' . $property->city : '')
                    ),
                    'image' => $property->featured_image ?? $property->image_url ?? ($property->images[0] ?? null),
                    'url' => "/properties/{$property->id}",
                    'badge' => null,
                    'price' => $property->price !== null ? (float) $property->price : null,
                    'rating' => null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function workerCards(): array
    {
        try {
            return ServiceWorker::where('is_available', true)
                ->orderByDesc('rating')
                ->limit(6)
                ->get()
                ->map(fn (ServiceWorker $worker) => [
                    'id' => $worker->id,
                    'title' => $worker->full_name,
                    'subtitle' => $worker->worker_type,
                    'image' => $worker->avatar_url,
                    'url' => "/building-services/workers/{$worker->id}",
                    'badge' => 'Hourly',
                    'price' => $worker->hourly_rate !== null ? (float) $worker->hourly_rate : null,
                    'rating' => $worker->rating !== null ? (float) $worker->rating : null,
                ])
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Uniform section card for marketplace products.
     *
     * @return array<string, mixed>
     */
    private function productCard(Product $product, ?string $badge = null): array
    {
        return [
            'id' => $product->id,
            'title' => $product->name,
            'subtitle' => $product->category,
            'image' => $product->image_url ?? ($product->images[0] ?? null),
            'url' => "/products/{$product->id}",
            'badge' => $badge,
            'price' => (float) $product->price,
            'rating' => $product->rating !== null ? (float) $product->rating : null,
        ];
    }

    /**
     * Latest courses mapped to marketplace card shape.
     *
     * @return array<int, array<string, mixed>>
     */
    private function learningCards(): array
    {
        try {
            return Course::orderByDesc('created_at')
                ->limit(4)
                ->get()
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'name' => $course->title,
                    'price' => (float) $course->price,
                    'originalPrice' => null,
                    'rating' => $course->rating !== null ? (float) $course->rating : null,
                    'image' => $course->thumbnail_url,
                    'category' => $course->category,
                    'vendor' => $course->instructor_name,
                    'type' => 'learning',
                    'badge' => 'Learning',
                    'link' => "/learn/{$course->id}",
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Top available doctors mapped to marketplace card shape.
     *
     * @return array<int, array<string, mixed>>
     */
    /**
     * Healthcare spotlight: available doctors plus live community aid
     * requests (spec H-C) so the health vertical surfaces the Aid surface
     * from home. Real rows only.
     *
     * @return array<int, array<string, mixed>>
     */
    private function healthcareCards(): array
    {
        $cards = [];

        try {
            $doctors = Doctor::where('is_available', true)
                ->orderByDesc('rating')
                ->limit(3)
                ->get();

            foreach ($doctors as $doctor) {
                $cards[] = [
                    'id' => $doctor->id,
                    'name' => $doctor->full_name,
                    'price' => (float) $doctor->consultation_fee,
                    'originalPrice' => null,
                    'rating' => $doctor->rating !== null ? (float) $doctor->rating : null,
                    'image' => $doctor->avatar_url,
                    'category' => $doctor->specialization,
                    'vendor' => null,
                    'type' => 'healthcare',
                    'badge' => 'Doctor',
                    'link' => "/healthcare/book?doctor={$doctor->id}",
                ];
            }
        } catch (\Throwable) {
        }

        // Live community aid requests (approved + funded only - never pending).
        try {
            $aids = \Modules\Healthcare\Entities\AidRequest::publiclyVisible()
                ->orderByDesc('created_at')
                ->limit(3)
                ->get();

            foreach ($aids as $aid) {
                $raised = (float) $aid->raised_amount;
                $goal = (float) $aid->goal_amount;
                $cards[] = [
                    'id' => $aid->id,
                    'name' => $aid->title,
                    'price' => $goal,
                    'originalPrice' => null,
                    'rating' => null,
                    'image' => null,
                    'category' => 'Community Aid',
                    'vendor' => null,
                    'type' => 'healthcare',
                    'badge' => $raised >= $goal && $goal > 0 ? 'Funded' : 'Aid',
                    'link' => "/healthcare/aid/{$aid->id}",
                ];
            }
        } catch (\Throwable) {
        }

        return $cards;
    }

    /**
     * Cross-section experts: top doctors, instructors, and vendor.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topExperts(): array
    {
        $experts = [];

        try {
            $doctors = Doctor::where('is_available', true)
                ->orderByDesc('rating')
                ->limit(2)
                ->get(['id', 'full_name', 'specialization', 'rating']);

            foreach ($doctors as $doctor) {
                $experts[] = [
                    'id' => $doctor->id,
                    'name' => $doctor->full_name,
                    'role' => $doctor->specialization ?? 'Health Expert',
                    'source' => 'healthcare',
                    'link' => "/healthcare/book?doctor={$doctor->id}",
                ];
            }
        } catch (\Throwable) {
            // tables may be missing on a fresh install — fall through to fallback
        }

        try {
            $instructors = Course::query()
                ->whereNotNull('instructor_name')
                ->distinct()
                ->limit(2)
                ->pluck('instructor_name');

            foreach ($instructors as $index => $name) {
                $experts[] = [
                    'id' => "instructor-{$index}",
                    'name' => $name,
                    'role' => 'Learning Expert',
                    'source' => 'learning',
                    'link' => '/learn',
                ];
            }
        } catch (\Throwable) {
        }

        try {
            $vendor = Vendor::orderByDesc('rating')
                ->first(['id', 'store_name', 'category', 'rating']);

            if ($vendor) {
                $experts[] = [
                    'id' => $vendor->id,
                    'name' => $vendor->store_name,
                    'role' => $vendor->category ?? 'Vendor',
                    'source' => 'vendor',
                    'link' => "/vendors/{$vendor->id}",
                ];
            }
        } catch (\Throwable) {
        }

        return $experts;
    }

    private function cartCount(): int
    {
        if (!Auth::check()) {
            return 0;
        }

        $cart = Cart::with('items')->where('user_id', Auth::id())->first();

        if (!$cart) {
            return 0;
        }

        return (int) $cart->items->sum('quantity');
    }
}
