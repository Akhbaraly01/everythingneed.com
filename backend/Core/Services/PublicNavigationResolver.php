<?php

namespace Core\Services;

use App\Models\User;
use Core\Services\Contracts\PublicNavigationInterface;
use Illuminate\Support\Facades\Cache;
use Modules\Admin\Entities\Navigation;
use Modules\Admin\Entities\NavigationItem;

class PublicNavigationResolver implements PublicNavigationInterface
{
    /** Menu locations the builder supports (mirrors AdminNavigationController). */
    public const LOCATIONS = ['header', 'footer', 'mobile', 'category', 'more'];

    public const CACHE_KEY = 'navigations.public';

    /** Raw-row cache TTL in seconds (writes flush explicitly). */
    public const CACHE_TTL = 300;

    public function menus(?User $user): array
    {
        $rows = $this->publishedRows();

        $menus = [];
        foreach (self::LOCATIONS as $location) {
            $menus[$location] = $this->visibleTree($rows[$location] ?? [], $user);
        }

        return $menus;
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Published navigations' active items grouped by location, ordered by
     * navigation then sort_order. Cached because every Inertia response
     * shares it; per-viewer filtering happens after the cache hit.
     *
     * @return array<string, list<array<string, mixed>>>
     */
    private function publishedRows(): array
    {
        try {
            $grouped = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
                $navigations = Navigation::query()
                    ->where('status', 'published')
                    ->orderBy('created_at')
                    ->orderBy('name')
                    ->get(['id', 'location']);

                $itemsByNavigation = NavigationItem::query()
                    ->whereIn('navigation_id', $navigations->pluck('id')->all())
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('created_at')
                    ->get()
                    ->groupBy('navigation_id');

                $grouped = [];
                foreach ($navigations as $navigation) {
                    foreach ($itemsByNavigation->get($navigation->id, collect()) as $item) {
                        $grouped[$navigation->location][] = $item->toArray();
                    }
                }

                return $grouped;
            });

            return is_array($grouped) ? $grouped : [];
        } catch (\Throwable) {
            // Fresh install without migrations: callers render their
            // hard-coded fallback menus instead of failing the page.
            return [];
        }
    }

    /**
     * Filter rows down to what this viewer may see, then assemble the
     * parent -> children tree. Visible children of a hidden parent are
     * promoted to top level rather than silently dropped.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function visibleTree(array $rows, ?User $user): array
    {
        $visible = [];
        foreach ($rows as $row) {
            if ($this->isVisible($row, $user)) {
                $visible[] = $row;
            }
        }

        $byParent = [];
        foreach ($visible as $row) {
            $byParent[$row['parent_id'] ?? null][] = $row;
        }

        $rendered = [];
        $build = function (?string $parentId) use (&$build, $byParent, &$rendered): array {
            $out = [];
            foreach ($byParent[$parentId] ?? [] as $row) {
                // Already visited: guards parent cycles and double renders.
                if (isset($rendered[$row['id']])) {
                    continue;
                }
                $rendered[$row['id']] = true;
                $out[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'url' => $this->itemUrl($row),
                    'icon' => $row['icon'] ?? null,
                    'target' => ! empty($row['open_in_new_tab']) ? '_blank' : null,
                    'devices' => ! empty($row['device_visibility']) ? array_values($row['device_visibility']) : null,
                    'children' => $build($row['id']),
                ];
            }

            return $out;
        };

        $tree = $build(null);

        // Promote orphans (visible item whose parent was filtered out)
        // together with their own subtrees.
        foreach ($visible as $row) {
            if (isset($rendered[$row['id']])) {
                continue;
            }
            $rendered[$row['id']] = true;
            $tree[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'url' => $this->itemUrl($row),
                'icon' => $row['icon'] ?? null,
                'target' => ! empty($row['open_in_new_tab']) ? '_blank' : null,
                'devices' => ! empty($row['device_visibility']) ? array_values($row['device_visibility']) : null,
                'children' => $build($row['id']),
            ];
        }

        return $tree;
    }

    /**
     * Visibility rules: all = everyone; guest = signed-out only;
     * auth = signed-in only; role = viewer holds any listed permission
     * (super_admin passes via User::hasPermission). Fail closed on
     * `role` items with an empty permission list.
     *
     * @param  array<string, mixed>  $row
     */
    private function isVisible(array $row, ?User $user): bool
    {
        $visibility = (string) ($row['visibility'] ?? 'all');

        return match ($visibility) {
            'guest' => $user === null,
            'auth' => $user !== null,
            'role' => $this->hasAnyPermission($user, (array) ($row['permissions'] ?? [])),
            default => true,
        };
    }

    /**
     * @param  list<string>  $permissions
     */
    private function hasAnyPermission(?User $user, array $permissions): bool
    {
        if ($user === null || $permissions === []) {
            return false;
        }

        foreach ($permissions as $permission) {
            if (is_string($permission) && $user->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Destination: explicit URL, else the CMS page route (spec S30 page
     * links resolve through /p/{slug}).
     *
     * @param  array<string, mixed>  $row
     */
    private function itemUrl(array $row): string
    {
        $url = trim((string) ($row['url'] ?? ''));
        if ($url !== '') {
            return $url;
        }

        $pageSlug = trim((string) ($row['page_slug'] ?? ''));
        if ($pageSlug !== '') {
            return '/p/' . ltrim($pageSlug, '/');
        }

        return '/';
    }
}
