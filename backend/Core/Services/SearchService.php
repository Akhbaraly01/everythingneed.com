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
}
