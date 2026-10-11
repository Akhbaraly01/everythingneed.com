<?php

namespace Core\Services;

use Core\Services\Contracts\SearchServiceInterface;
use Illuminate\Support\Facades\DB;

class SearchService extends BaseService implements SearchServiceInterface
{
    public function query(array $params): array
    {
        $type = $params['type'] ?? null;
        $search = $params['search'] ?? '';
        $filters = $params['filters'] ?? [];
        $sort = $params['sort'] ?? 'created_at';
        $order = $params['order'] ?? 'desc';
        $page = $params['page'] ?? 1;
        $perPage = $params['per_page'] ?? 15;

        $modelMap = $this->getModelMap();

        if ($type && isset($modelMap[$type])) {
            $modelClass = $modelMap[$type];
            $query = $modelClass::query();
        } else {
            $query = $this->buildGlobalSearch($search, $modelMap);
            return $this->paginateResult($query, $page, $perPage);
        }

        if ($search && method_exists($query, 'scopeSearch')) {
            $query->search($search);
        }

        foreach ($filters as $column => $value) {
            if (is_array($value)) {
                $query->whereBetween($column, $value);
            } else {
                $query->where($column, $value);
            }
        }

        $query->orderBy($sort, $order);

        return $this->paginateResult($query, $page, $perPage);
    }

    public function index(string $type, string $id, array $data): void
    {
        // Index into search cache/elastic if configured
        $cacheKey = "search:{$type}:{$id}";
        cache()->put($cacheKey, $data, now()->addHours(24));
    }

    public function remove(string $type, string $id): void
    {
        $cacheKey = "search:{$type}:{$id}";
        cache()->forget($cacheKey);
    }

    private function getModelMap(): array
    {
        return [
            'products' => \Modules\Products\Entities\Product::class,
            'categories' => \Modules\Categories\Entities\Category::class,
            'vendors' => \Modules\Vendors\Entities\Vendor::class,
            'users' => \App\Models\User::class,
            'orders' => \Modules\Orders\Entities\VendorOrder::class,
            'courses' => \Modules\Learn\Entities\Course::class,
            'properties' => \Modules\RealEstate\Entities\Property::class,
            'hotels' => \Modules\Hotels\Entities\Hotel::class,
            'restaurants' => \Modules\Food\Entities\Restaurant::class,
        ];
    }

    private function buildGlobalSearch(string $search, array $modelMap): \Illuminate\Database\Eloquent\Builder
    {
        $query = null;

        foreach ($modelMap as $type => $modelClass) {
            $subQuery = $modelClass::where('name', 'ilike', "%{$search}%");
            if ($query === null) {
                $query = $subQuery;
            } else {
                $query->unionAll($subQuery);
            }
        }

        return $query ?? DB::table('nothing')->whereRaw('1=0');
    }

    private function paginateResult($query, int $page, int $perPage): array
    {
        $total = (clone $query)->count();
        $results = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return [
            'data' => $results,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => (int) ceil($total / $perPage),
        ];
    }

    /**
     * Spec §49 — unified discovery across every marketplace domain.
     *
     * Every row carries a server-computed `type` and canonical `url` so the
     * UI never has to guess links (no dead destinations). Unknown $type
     * values yield [] (the controller validates the whitelist first).
     *
     * @return array<string, list<array<string, mixed>>>
     */
    public function discover(string $term, string $type): array
    {
        $like = "%{$term}%";
        $results = [];

        if ($type === 'all' || $type === 'products') {
            $results['products'] = $this->rows(
                DB::table('products')
                    ->where('is_active', true)
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('category', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'slug', 'description', 'price', 'image_url as image', 'category']),
                'product',
                fn (object $r) => '/products/'.($r->slug ?? $r->id),
            );
        }

        if ($type === 'all' || $type === 'categories') {
            $results['categories'] = $this->rows(
                DB::table('categories')
                    ->where('is_active', true)
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('slug', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'slug', 'description', 'icon', 'image_url as image']),
                'category',
                fn (object $r) => '/categories/'.($r->slug ?? $r->id),
            );
        }

        if ($type === 'all' || $type === 'services') {
            $results['services'] = $this->rows(
                DB::table('need_items')
                    ->where('is_available', true)
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'description', 'price', 'price as budget', 'category_id']),
                'service',
                fn () => '/needs',
            );
        }

        if ($type === 'all' || $type === 'needs') {
            $results['needs'] = $this->rows(
                DB::table('need_requests')
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('title', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('subcategory', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'request_number', 'title', 'description', 'budget_min', 'budget_max', 'location', 'status']),
                'need',
                fn (object $r) => '/needs/requests/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'doctors') {
            $results['doctors'] = $this->rows(
                DB::table('doctors')
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('full_name', 'ILIKE', $like)
                            ->orWhere('specialization', 'ILIKE', $like)
                            ->orWhere('qualification', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'full_name as name', 'specialization', 'avatar_url as image', 'consultation_fee as price', 'rating']),
                'doctor',
                fn (object $r) => '/healthcare/doctors/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'experts') {
            // Experts are the doctors roster surfaced through the experts hub.
            $results['experts'] = $this->rows(
                DB::table('doctors')
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('full_name', 'ILIKE', $like)
                            ->orWhere('specialization', 'ILIKE', $like)
                            ->orWhere('qualification', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'full_name as name', 'specialization', 'avatar_url as image', 'rating']),
                'expert',
                fn (object $r) => '/experts/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'vendors') {
            $results['vendors'] = $this->rows(
                DB::table('vendors')
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('store_name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('category', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'store_name as name', 'slug', 'category', 'description', 'rating', 'is_verified']),
                'vendor',
                fn (object $r) => '/stores/'.($r->slug ?? $r->id),
            );
        }

        if ($type === 'all' || $type === 'courses') {
            $results['courses'] = $this->rows(
                DB::table('courses')
                    ->where(function ($q) use ($like) {
                        $q->where('title', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('instructor_name', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'title', 'price', 'description', 'instructor_name', 'thumbnail_url as thumbnail']),
                'course',
                fn (object $r) => '/learn/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'jobs') {
            $results['jobs'] = $this->rows(
                DB::table('job_posts')
                    ->where('is_active', true)
                    ->where(function ($q) use ($like) {
                        $q->where('title', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('company', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'title', 'company', 'location', 'salary_min', 'salary_max', 'currency']),
                'job',
                fn (object $r) => '/jobs/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'hotels') {
            $results['hotels'] = $this->rows(
                DB::table('hotels')
                    ->where('is_active', true)
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('city', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'description', 'city', 'state', 'country', 'star_rating']),
                'hotel',
                fn (object $r) => '/hotels/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'restaurants') {
            $results['restaurants'] = $this->rows(
                DB::table('restaurants')
                    ->where('is_active', true)
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('cuisine_type', 'ILIKE', $like)
                            ->orWhere('city', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'description', 'cuisine_type', 'rating', 'image_url as image']),
                'restaurant',
                fn (object $r) => '/food/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'properties') {
            $results['properties'] = $this->rows(
                DB::table('properties')
                    ->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('title', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like)
                            ->orWhere('city', 'ILIKE', $like)
                            ->orWhere('address', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'title', 'description', 'price', 'city', 'property_type', 'listing_type']),
                'property',
                fn (object $r) => '/real-estate/'.$r->id,
            );
        }

        if ($type === 'all' || $type === 'agriculture') {
            // Agriculture marketplace = agri-category products (real rows,
            // linked to the agriculture catalogue page).
            $results['agriculture'] = $this->rows(
                DB::table('products')
                    ->where('is_active', true)
                    ->where('category', 'ILIKE', '%agri%')
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'description', 'price', 'image_url as image', 'category']),
                'agriculture',
                fn () => '/agriculture/products',
            );
        }

        if ($type === 'all' || $type === 'building') {
            $results['building'] = $this->rows(
                DB::table('vendor_services')
                    ->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($like) {
                        $q->where('name', 'ILIKE', $like)
                            ->orWhere('description', 'ILIKE', $like);
                    })
                    ->limit(10)
                    ->get(['id', 'name', 'description', 'price', 'duration_minutes']),
                'building',
                fn () => '/building-services',
            );
        }

        return $results;
    }

    /**
     * Casts rows to arrays and stamps the canonical type + url on each.
     *
     * @param  \Illuminate\Support\Collection<int, object>  $rows
     * @param  callable(object): string  $urlFor
     * @return list<array<string, mixed>>
     */
    private function rows($rows, string $type, callable $urlFor): array
    {
        return $rows
            ->map(fn (object $row) => array_merge((array) $row, [
                'type' => $type,
                'url' => $urlFor($row),
            ]))
            ->values()
            ->all();
    }
}
