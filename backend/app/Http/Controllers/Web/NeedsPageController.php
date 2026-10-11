<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Food\Entities\Restaurant;
use Modules\Healthcare\Entities\Doctor;
use Modules\Hotels\Entities\Hotel;
use Modules\Jobs\Entities\JobPost;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedItem;
use Modules\Needs\Entities\NeedRequest;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\Pharmacy\Entities\Medicine;
use Modules\Products\Entities\Product;
use Modules\RealEstate\Entities\Property;
use Modules\Rides\Entities\Flight;

/**
 * Wave F (spec S10/S12/S14): server-rendered Needs pages. Sections are
 * built from real rows only - every query is isolated so one broken
 * vertical degrades to an empty (never fabricated) section.
 */
class NeedsPageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('needs/Index', [
            'categories' => $this->categories(),
            'nearbyCity' => $this->nearbyCity(),
            'sections' => [
                'activeRequests' => $this->activeRequests(),
                'nearbyServices' => $this->nearbyServices(),
                'featuredServices' => $this->featuredServices(),
                'deals' => $this->deals(),
                'workers' => $this->workers(),
                'professionals' => $this->professionals(),
                'transportation' => $this->transportation(),
                'hotels' => $this->hotels(),
                'construction' => $this->construction(),
                'agriculture' => $this->agriculture(),
                'food' => $this->food(),
                'jobs' => $this->jobs(),
                'realEstate' => $this->realEstate(),
                'pharmacy' => $this->pharmacy(),
                'healthcare' => $this->healthcare(),
                'generalServices' => $this->generalServices(),
            ],
        ]);
    }

    public function category(string $slug): Response
    {
        $category = NeedCategory::where('slug', $slug)->first();

        return Inertia::render('needs/Category', [
            'slug' => $slug,
            'category' => $category
                ? ['id' => $category->id, 'name' => $category->name, 'slug' => $category->slug, 'description' => $category->description]
                : null,
            'requests' => $this->requestsForCategory($category?->id),
            'items' => $this->itemsForCategory($category?->id),
        ]);
    }

    // ── Spec S10 sections ──────────────────────────────────────────────────

    private function categories(): array
    {
        try {
            return NeedCategory::orderBy('sort_order')->get()
                ->map(fn (NeedCategory $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'description' => $c->description,
                    'icon' => $c->icon,
                    'color' => $c->color,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function activeRequests(): array
    {
        try {
            return NeedRequest::with('category:id,name,slug')
                ->whereIn('status', NeedRequest::OPEN_STATUSES)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (NeedRequest $r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'subtitle' => $r->location ?: ($r->budget_max ? 'Budget '.$r->currency.' '.$r->budget_max : 'Open budget'),
                    'image' => null,
                    'url' => $r->category
                        ? '/needs/'.$r->category->slug.'/'.$r->id
                        : '/needs/requests/'.$r->id,
                    'badge' => $r->category?->name,
                    'price' => $r->budget_max,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function nearbyCity(): ?string
    {
        try {
            return auth()->user()
                ? DB::table('addresses')
                    ->where('user_id', auth()->id())
                    ->where('is_default', true)
                    ->value('city')
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function nearbyServices(): array
    {
        try {
            $city = $this->nearbyCity();

            if (!$city) {
                return [];
            }

            return WorkerProfile::with('user:id,name')
                ->where('city', 'ilike', $city)
                ->where('availability', 'available')
                ->orderByDesc('rating_avg')
                ->limit(6)
                ->get()
                ->map(fn (WorkerProfile $w) => $this->workerProfileCard($w))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function featuredServices(): array
    {
        try {
            return ServiceWorker::where('is_available', true)
                ->orderByDesc('rating')
                ->limit(6)
                ->get()
                ->map(fn (ServiceWorker $w) => [
                    'id' => $w->id,
                    'title' => $w->full_name,
                    'subtitle' => ucfirst(str_replace('_', ' ', $w->worker_type)),
                    'image' => $w->avatar_url,
                    'url' => '/building-services/workers/'.$w->id,
                    'badge' => $w->hourly_rate ? '$'.$w->hourly_rate.'/hr' : null,
                    'price' => $w->hourly_rate,
                    'rating' => $w->rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function deals(): array
    {
        try {
            return NeedItem::where('is_available', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (NeedItem $d) => [
                    'id' => $d->id,
                    'title' => $d->name,
                    'subtitle' => \Illuminate\Support\Str::limit((string) $d->description, 80),
                    'image' => $d->image_url,
                    'url' => '/deals/'.$d->id,
                    'badge' => 'Deal',
                    'price' => $d->price,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function workers(): array
    {
        try {
            return WorkerProfile::with('user:id,name')
                ->where('availability', 'available')
                ->orderByDesc('rating_avg')
                ->limit(6)
                ->get()
                ->map(fn (WorkerProfile $w) => $this->workerProfileCard($w))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function professionals(): array
    {
        try {
            return Doctor::where('is_available', true)
                ->orderByDesc('experience_years')
                ->limit(6)
                ->get()
                ->map(fn (Doctor $d) => [
                    'id' => $d->id,
                    'title' => $d->full_name,
                    'subtitle' => $d->specialization,
                    'image' => $d->avatar_url,
                    'url' => '/experts/'.$d->id,
                    'badge' => $d->consultation_fee ? '$'.$d->consultation_fee : null,
                    'price' => $d->consultation_fee,
                    'rating' => $d->rating ?? null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function transportation(): array
    {
        try {
            return Flight::where('is_active', true)
                ->orderBy('departure_time')
                ->limit(6)
                ->get()
                ->map(fn (Flight $f) => [
                    'id' => $f->id,
                    'title' => $f->origin_city.' → '.$f->destination_city,
                    'subtitle' => $f->airline,
                    'image' => null,
                    'url' => '/flights/'.$f->id,
                    'badge' => $f->flight_number,
                    'price' => $f->price,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function hotels(): array
    {
        try {
            return Hotel::where('is_active', true)
                ->orderByDesc('star_rating')
                ->limit(6)
                ->get()
                ->map(fn (Hotel $h) => [
                    'id' => $h->id,
                    'title' => $h->name,
                    'subtitle' => $h->city,
                    'image' => $h->image_url,
                    'url' => '/hotels/'.$h->id,
                    'badge' => $h->star_rating ? $h->star_rating.'-star' : null,
                    'price' => null,
                    'rating' => $h->star_rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function construction(): array
    {
        try {
            return ServiceWorker::where('is_available', true)
                ->where('worker_type', 'ilike', '%construct%')
                ->orderByDesc('rating')
                ->limit(6)
                ->get()
                ->map(fn (ServiceWorker $w) => [
                    'id' => $w->id,
                    'title' => $w->full_name,
                    'subtitle' => ucfirst(str_replace('_', ' ', $w->worker_type)),
                    'image' => $w->avatar_url,
                    'url' => '/building-services/workers/'.$w->id,
                    'badge' => $w->hourly_rate ? '$'.$w->hourly_rate.'/hr' : null,
                    'price' => $w->hourly_rate,
                    'rating' => $w->rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function agriculture(): array
    {
        try {
            return Product::where('is_active', true)
                ->where('category', 'ilike', '%agric%')
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'title' => $p->name,
                    'subtitle' => \Illuminate\Support\Str::limit((string) $p->description, 80),
                    'image' => $p->image_url ?? ($p->images[0] ?? null),
                    'url' => '/products/'.$p->id,
                    'badge' => $p->category,
                    'price' => $p->price,
                    'rating' => $p->rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function food(): array
    {
        try {
            return Restaurant::where('is_active', true)
                ->orderByDesc('rating')
                ->limit(6)
                ->get()
                ->map(fn (Restaurant $r) => [
                    'id' => $r->id,
                    'title' => $r->name,
                    'subtitle' => $r->cuisine_type,
                    'image' => $r->image_url,
                    'url' => '/food/'.$r->id,
                    'badge' => $r->city,
                    'price' => null,
                    'rating' => $r->rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function jobs(): array
    {
        try {
            return JobPost::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (JobPost $j) => [
                    'id' => $j->id,
                    'title' => $j->title,
                    'subtitle' => $j->company.' · '.$j->location,
                    'image' => null,
                    'url' => '/jobs/'.$j->id,
                    'badge' => ucwords(str_replace('_', ' ', $j->job_type)),
                    'price' => null,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function realEstate(): array
    {
        try {
            return Property::where('is_active', true)
                ->orderByDesc('is_featured')
                ->limit(6)
                ->get()
                ->map(fn (Property $p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'subtitle' => $p->city.', '.$p->country,
                    'image' => $p->featured_image ?? ($p->image_url ?? ($p->images[0] ?? null)),
                    'url' => '/properties/'.$p->id,
                    'badge' => $p->property_type,
                    'price' => $p->price,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function pharmacy(): array
    {
        try {
            return Medicine::orderByDesc('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Medicine $m) => [
                    'id' => $m->id,
                    'title' => $m->name,
                    'subtitle' => $m->generic_name ?? $m->category,
                    'image' => $m->image_url,
                    'url' => '/pharmacy',
                    'badge' => $m->requires_prescription ? 'Rx' : null,
                    'price' => $m->price,
                    'rating' => null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function healthcare(): array
    {
        try {
            return Doctor::where('is_available', true)
                ->orderByDesc('rating')
                ->limit(6)
                ->get()
                ->map(fn (Doctor $d) => [
                    'id' => $d->id,
                    'title' => $d->full_name,
                    'subtitle' => $d->specialization,
                    'image' => $d->avatar_url,
                    'url' => '/healthcare',
                    'badge' => $d->qualification,
                    'price' => $d->consultation_fee,
                    'rating' => $d->rating ?? null,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function generalServices(): array
    {
        try {
            return ServiceWorker::where('is_available', true)
                ->orderBy('completed_jobs')
                ->limit(6)
                ->get()
                ->map(fn (ServiceWorker $w) => [
                    'id' => $w->id,
                    'title' => $w->full_name,
                    'subtitle' => ucfirst(str_replace('_', ' ', $w->worker_type)),
                    'image' => $w->avatar_url,
                    'url' => '/building-services/workers/'.$w->id,
                    'badge' => $w->completed_jobs ? $w->completed_jobs.' jobs' : null,
                    'price' => $w->hourly_rate,
                    'rating' => $w->rating,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function workerProfileCard(WorkerProfile $w): array
    {
        return [
            'id' => $w->id,
            'title' => $w->headline,
            'subtitle' => trim(($w->user?->name ? $w->user->name.' · ' : '').($w->city ?? '')),
            'image' => null,
            'url' => '/job-seekers',
            'badge' => $w->category,
            'price' => $w->hourly_rate,
            'rating' => (float) $w->rating_avg,
        ];
    }

    // ── Spec S12 category browse ───────────────────────────────────────────

    private function requestsForCategory(?string $categoryId): array
    {
        if (!$categoryId) {
            return [];
        }

        try {
            return NeedRequest::with('category:id,name,slug')
                ->where('category_id', $categoryId)
                ->whereIn('status', NeedRequest::OPEN_STATUSES)
                ->orderByDesc('created_at')
                ->limit(24)
                ->get()
                ->map(fn (NeedRequest $r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'description' => \Illuminate\Support\Str::limit((string) $r->description, 140),
                    'status' => $r->status,
                    'budget_min' => $r->budget_min,
                    'budget_max' => $r->budget_max,
                    'currency' => $r->currency,
                    'location' => $r->location,
                    'deadline' => $r->deadline?->toDateString(),
                    'created_at' => $r->created_at,
                    'url' => '/needs/'.$r->category?->slug.'/'.$r->id,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function itemsForCategory(?string $categoryId): array
    {
        if (!$categoryId) {
            return [];
        }

        try {
            return DB::table('need_items')
                ->where('category_id', $categoryId)
                ->where('is_available', true)
                ->orderByDesc('created_at')
                ->limit(24)
                ->get()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'description' => \Illuminate\Support\Str::limit((string) $item->description, 140),
                    'price' => $item->price,
                    'image_url' => $item->image_url,
                    'url' => '/deals/'.$item->id,
                ])->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
