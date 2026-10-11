<?php

namespace Modules\Admin\Services\Cms;

use Illuminate\Support\Str;
use Modules\BuildingServices\Entities\ServiceWorker;
use Modules\Categories\Entities\Category;
use Modules\Healthcare\Entities\Department;
use Modules\Healthcare\Entities\Doctor;
use Modules\Learn\Entities\Course;
use Modules\Needs\Entities\NeedCategory;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;

/**
 * Dynamic block data resolution (spec S43).
 *
 * Grid blocks store only their source configuration; the backend resolves
 * real database rows into a uniform item shape at render time. URLs always
 * target routes that exist today (no dead links), and every query is
 * server-authoritative with a hard limit (no giant payloads / N+1).
 */
class BlockResolver
{
    /** Uniform item DTO keys handed to the React renderer. */
    public const ITEM_KEYS = ['id', 'title', 'subtitle', 'image', 'url', 'badge', 'price'];

    /**
     * @param  array<int, array<string, mixed>>  $blocks  block rows (type/data/is_visible)
     * @return array<int, array<string, mixed>>  same rows with `items` attached for dynamic types
     */
    public function resolve(array $blocks): array
    {
        foreach ($blocks as $i => $block) {
            if (! ($block['is_visible'] ?? true)) {
                continue;
            }
            $type = $block['type'] ?? '';
            if (! in_array($type, self::DYNAMIC_TYPES, true)) {
                continue;
            }
            $blocks[$i]['items'] = $this->items($type, is_array($block['data'] ?? null) ? $block['data'] : []);
        }

        return $blocks;
    }

    /** Block types whose items are resolved from the database. */
    public const DYNAMIC_TYPES = [
        'product_grid', 'course_grid', 'doctor_grid', 'expert_grid',
        'vendor_grid', 'category_grid', 'service_grid',
        'need_categories', 'healthcare_services', 'learning_categories',
    ];

    /** @return array<int, array<string, mixed>> */
    public function items(string $type, array $data): array
    {
        $limit = min(24, max(1, (int) ($data['limit'] ?? 8)));
        $source = (string) ($data['source'] ?? 'latest');
        $filter = trim((string) ($data['filter'] ?? ''));

        return match ($type) {
            'product_grid' => $this->products($source, $filter, $limit),
            'course_grid' => $this->courses($source, $filter, $limit),
            'doctor_grid' => $this->doctors($source, $filter, $limit),
            'expert_grid' => $this->experts($source, $filter, $limit),
            'vendor_grid' => $this->vendors($source, $filter, $limit),
            'category_grid' => $this->categories($source, $filter, $limit),
            'service_grid' => $this->services($source, $filter, $limit),
            'need_categories' => $this->needCategories($limit),
            'healthcare_services' => $this->healthcareServices($limit),
            'learning_categories' => $this->learningCategories($limit),
            default => [],
        };
    }

    /** @return array<int, array<string, mixed>> */
    private function products(string $source, string $filter, int $limit): array
    {
        $query = Product::query()->where('is_active', true);

        if ($source === 'selected' && $filter !== '') {
            $query->where('category', 'ilike', $filter);
        } elseif ($source === 'featured') {
            $query->whereNotNull('approved_at')
                ->orderByDesc('rating')
                ->orderByDesc('reviews_count');
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Product $p) => $this->item(
                id: $p->id,
                title: $p->name,
                subtitle: $p->category,
                image: $p->image_url,
                url: '/products/'.$p->id,
                price: $p->price,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function courses(string $source, string $filter, int $limit): array
    {
        $query = Course::query();

        if ($source === 'selected' && $filter !== '') {
            $query->where('category', 'ilike', $filter);
        } elseif ($source === 'featured') {
            $query->where('is_featured', true)->orderByDesc('rating');
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Course $c) => $this->item(
                id: $c->id,
                title: $c->title,
                subtitle: $c->instructor_name,
                image: $c->thumbnail_url,
                url: '/learn/'.$c->id,
                badge: $c->category,
                price: $c->price,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function doctors(string $source, string $filter, int $limit): array
    {
        $query = Doctor::query();

        if ($source === 'selected' && $filter !== '') {
            $query->where('specialization', 'ilike', $filter);
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Doctor $d) => $this->item(
                id: $d->id,
                title: $d->full_name,
                subtitle: $d->specialization,
                image: $d->avatar_url,
                url: '/healthcare/doctors/'.$d->id,
                badge: $d->rating !== null ? '★ '.$d->rating : null,
                price: $d->consultation_fee,
            ))
            ->all();
    }

    /**
     * Experts are rendered from the same verified professional pool the
     * /experts console uses (ExpertController reads doctors), but link to
     * the expert destination.
     *
     * @return array<int, array<string, mixed>>
     */
    private function experts(string $source, string $filter, int $limit): array
    {
        $query = Doctor::query();

        if ($source === 'selected' && $filter !== '') {
            $query->where('specialization', 'ilike', $filter);
        }

        return $query->orderByDesc('rating')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Doctor $d) => $this->item(
                id: $d->id,
                title: $d->full_name,
                subtitle: $d->specialization,
                image: $d->avatar_url,
                url: '/experts/'.$d->id,
                badge: $d->rating !== null ? '★ '.$d->rating : null,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function vendors(string $source, string $filter, int $limit): array
    {
        $query = Vendor::query();

        if ($source === 'verified') {
            $query->where('is_verified', true)->orderByDesc('rating');
        } elseif ($source === 'selected' && $filter !== '') {
            $query->where('category', 'ilike', $filter);
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Vendor $v) => $this->item(
                id: $v->id,
                title: $v->store_name,
                subtitle: $v->category,
                image: null,
                url: '/vendors/'.$v->id,
                badge: $v->is_verified ? 'Verified' : null,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function categories(string $source, string $filter, int $limit): array
    {
        $query = Category::query()->where('is_active', true);

        if ($source === 'selected' && $filter !== '') {
            $parent = Category::query()->where('slug', $filter)->where('is_active', true)->first();
            $query->where('parent_id', $parent?->id);
        }

        return $query->orderBy('sort_order')->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (Category $c) => $this->item(
                id: $c->id,
                title: $c->name,
                subtitle: null,
                image: $c->image_url,
                url: '/categories/'.$c->id,
                badge: $c->icon,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function services(string $source, string $filter, int $limit): array
    {
        $query = ServiceWorker::query();

        if ($source === 'selected' && $filter !== '') {
            $query->where('worker_type', 'ilike', $filter);
        }

        return $query->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (ServiceWorker $w) => $this->item(
                id: $w->id,
                title: $w->full_name,
                subtitle: $w->worker_type,
                image: $w->avatar_url,
                url: '/building-services/workers/'.$w->id,
                badge: $w->rating !== null ? '★ '.$w->rating : null,
                price: $w->hourly_rate,
            ))
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function needCategories(int $limit): array
    {
        return NeedCategory::query()
            ->orderBy('sort_order')->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (NeedCategory $c) => $this->item(
                id: $c->id,
                title: $c->name,
                subtitle: Str::limit((string) $c->description, 120),
                image: null,
                url: '/needs/'.$c->slug,
                badge: $c->icon,
            ))
            ->all();
    }

    /**
     * Healthcare service lines resolve from the platform's departments and
     * deep-link to the specialty page that lists matching doctors.
     *
     * @return array<int, array<string, mixed>>
     */
    private function healthcareServices(int $limit): array
    {
        return Department::query()
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (Department $d) => $this->item(
                id: $d->id,
                title: $d->name,
                subtitle: $d->description ? Str::limit((string) $d->description, 120) : null,
                image: null,
                url: '/healthcare/specialty/'.rawurlencode($d->name),
            ))
            ->all();
    }

    /**
     * Learning categories are the distinct course categories (same source
     * as GET /api/course-categories), deep-linking to the course catalog.
     *
     * @return array<int, array<string, mixed>>
     */
    private function learningCategories(int $limit): array
    {
        return Course::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->selectRaw('category, count(*) as courses_count')
            ->groupBy('category')
            ->orderBy('category')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => $this->item(
                id: (string) Str::slug($row->category),
                title: $row->category,
                subtitle: $row->courses_count.' course'.((int) $row->courses_count === 1 ? '' : 's'),
                image: null,
                url: '/learn/courses',
            ))
            ->all();
    }

    private function item(
        string $id,
        string $title,
        ?string $subtitle,
        ?string $image,
        string $url,
        ?string $badge = null,
        ?float $price = null,
    ): array {
        return [
            'id' => $id,
            'title' => $title,
            'subtitle' => $subtitle,
            'image' => $image,
            'url' => $url,
            'badge' => $badge,
            'price' => $price,
        ];
    }
}
