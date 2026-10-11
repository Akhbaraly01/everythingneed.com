<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Admin\Entities\Navigation;
use Modules\Admin\Entities\NavigationItem;

/**
 * Navigation builder API (spec S46).
 *
 * Administrations manage header/footer/mobile/category/more menus without
 * touching source code. Items are sent as a full replacement set (client
 * supplies UUIDs for new rows so parent links survive the round-trip).
 */
class AdminNavigationController extends Controller
{
    public const LOCATIONS = ['header', 'footer', 'mobile', 'category', 'more'];
    public const VISIBILITIES = ['all', 'guest', 'auth', 'role'];
    public const DEVICES = ['desktop', 'mobile'];

    /** GET /api/admin/navigations */
    public function index(): JsonResponse
    {
        $navigations = Navigation::query()
            ->with(['items' => fn ($q) => $q->orderBy('sort_order')->orderBy('created_at')])
            ->orderBy('location')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $navigations]);
    }

    /** POST /api/admin/navigations */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'location' => 'required|string|in:'.implode(',', self::LOCATIONS),
            'status' => 'sometimes|string|in:draft,published',
        ]);

        $navigation = Navigation::create([
            'name' => $data['name'],
            'location' => $data['location'],
            'status' => $data['status'] ?? 'draft',
        ]);

        $this->flushMenuCache();

        return response()->json(['message' => 'Navigation created', 'data' => $navigation], 201);
    }

    /** PUT /api/admin/navigations/{id} */
    public function update(Request $request, string $id): JsonResponse
    {
        $navigation = Navigation::find($id);
        abort_unless($navigation !== null, 404, 'Navigation not found');

        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'location' => 'sometimes|string|in:'.implode(',', self::LOCATIONS),
            'status' => 'sometimes|string|in:draft,published',
        ]);

        $navigation->update($data);

        $this->flushMenuCache();

        return response()->json(['message' => 'Navigation updated', 'data' => $navigation->fresh()]);
    }

    /** DELETE /api/admin/navigations/{id} */
    public function destroy(string $id): JsonResponse
    {
        $navigation = Navigation::find($id);
        abort_unless($navigation !== null, 404, 'Navigation not found');

        DB::transaction(function () use ($navigation) {
            NavigationItem::where('navigation_id', $navigation->id)->delete();
            $navigation->delete();
        });

        $this->flushMenuCache();

        return response()->json(['message' => 'Navigation deleted']);
    }

    /** PUT /api/admin/navigations/{id}/items - full replacement upsert. */
    public function replaceItems(Request $request, string $id): JsonResponse
    {
        $navigation = Navigation::find($id);
        abort_unless($navigation !== null, 404, 'Navigation not found');

        $data = $request->validate([
            'items' => 'required|array|max:200',
            'items.*.id' => 'required|uuid',
            'items.*.title' => 'required|string|max:160',
            'items.*.url' => 'nullable|string|max:500',
            'items.*.page_slug' => 'nullable|string|max:200|regex:/^[a-z0-9\-\/]*$/',
            'items.*.icon' => 'nullable|string|max:80',
            'items.*.parent_id' => 'nullable|uuid',
            'items.*.visibility' => 'sometimes|string|in:'.implode(',', self::VISIBILITIES),
            'items.*.permissions' => 'nullable|array|max:20',
            'items.*.permissions.*' => 'string|max:100',
            'items.*.device_visibility' => 'nullable|array|max:4',
            'items.*.device_visibility.*' => 'string|in:'.implode(',', self::DEVICES),
            'items.*.sort_order' => 'sometimes|integer|min:0|max:9999',
            'items.*.is_active' => 'sometimes|boolean',
            'items.*.open_in_new_tab' => 'sometimes|boolean',
        ]);

        $payload = $data['items'];

        // Every item needs a destination: URL, CMS page slug, or both.
        foreach ($payload as $i => $item) {
            $url = trim((string) ($item['url'] ?? ''));
            $pageSlug = trim((string) ($item['page_slug'] ?? ''));
            if ($url === '' && $pageSlug === '') {
                abort(response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ["items.{$i}.url" => ['Each navigation item needs a URL or a CMS page.']],
                ], 422));
            }
        }

        $ids = array_column($payload, 'id');
        if (count($ids) !== count(array_unique($ids))) {
            abort(response()->json([
                'message' => 'Validation failed.',
                'errors' => ['items' => ['Duplicate navigation item ids.']],
            ], 422));
        }

        // Parent ids must reference an item in this payload (or be null).
        $idSet = array_flip($ids);
        foreach ($payload as $i => $item) {
            $parent = $item['parent_id'] ?? null;
            if ($parent !== null && ! isset($idSet[$parent])) {
                abort(response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ["items.{$i}.parent_id" => ['Parent must be another item in this menu.']],
                ], 422));
            }
            if ($parent === $item['id']) {
                abort(response()->json([
                    'message' => 'Validation failed.',
                    'errors' => ["items.{$i}.parent_id" => ['An item cannot be its own parent.']],
                ], 422));
            }
        }

        // Cycle guard: walking parents must reach null within N steps.
        $parents = array_column($payload, 'parent_id', 'id');
        foreach (array_keys($parents) as $start) {
            $seen = [$start => true];
            $node = $parents[$start];
            while ($node !== null) {
                if (isset($seen[$node])) {
                    abort(response()->json([
                        'message' => 'Validation failed.',
                        'errors' => ['items' => ['Navigation items cannot form a parent cycle.']],
                    ], 422));
                }
                $seen[$node] = true;
                $node = $parents[$node] ?? null;
            }
        }

        // Ids must belong to this navigation (or be brand new).
        $foreign = NavigationItem::whereIn('id', $ids)
            ->where('navigation_id', '!=', $navigation->id)
            ->pluck('id');
        if ($foreign->isNotEmpty()) {
            abort(response()->json([
                'message' => 'Validation failed.',
                'errors' => ['items' => ['Item ids must be unique to this navigation.']],
            ], 422));
        }

        // sort_order defaults to the client's list position before any
        // reordering below.
        foreach ($payload as $i => $item) {
            if (! array_key_exists('sort_order', $item)) {
                $payload[$i]['sort_order'] = $i;
            }
        }

        // Parents must exist before children regardless of the order the
        // client listed them in (the payload is validated, not topologically
        // sorted). Cycles are rejected above, so this always drains.
        $ordered = [];
        $done = [];
        $pending = $payload;
        while ($pending !== []) {
            $progress = false;
            foreach ($pending as $key => $item) {
                $parent = $item['parent_id'] ?? null;
                if ($parent !== null && ! isset($done[$parent])) {
                    continue;
                }
                $ordered[] = $item;
                $done[$item['id']] = true;
                unset($pending[$key]);
                $progress = true;
            }
            if (! $progress) {
                $ordered = array_merge($ordered, array_values($pending));
                break;
            }
        }
        $payload = $ordered;

        DB::transaction(function () use ($navigation, $payload) {
            $keep = array_column($payload, 'id');
            NavigationItem::where('navigation_id', $navigation->id)
                ->whereNotIn('id', $keep)
                ->delete();

            foreach ($payload as $i => $item) {
                $row = [
                    'navigation_id' => $navigation->id,
                    'parent_id' => $item['parent_id'] ?? null,
                    'title' => $item['title'],
                    'url' => trim((string) ($item['url'] ?? '')) ?: null,
                    'page_slug' => trim((string) ($item['page_slug'] ?? '')) ?: null,
                    'icon' => $item['icon'] ?? null,
                    'visibility' => $item['visibility'] ?? 'all',
                    'permissions' => $item['permissions'] ?? null,
                    'device_visibility' => $item['device_visibility'] ?? null,
                    'sort_order' => $item['sort_order'] ?? 0,
                    'is_active' => $item['is_active'] ?? true,
                    'open_in_new_tab' => $item['open_in_new_tab'] ?? false,
                    'updated_at' => now(),
                ];

                $existing = NavigationItem::find($item['id']);
                if ($existing !== null) {
                    $existing->update($row);
                } else {
                    // forceCreate: the model guards `id`, but the client owns
                    // these UUIDs (parent links depend on them round-tripping).
                    NavigationItem::forceCreate($row + [
                        'id' => $item['id'],
                        'created_at' => now(),
                    ]);
                }
            }

            $navigation->touch();
        });

        $navigation->load('items');
        $this->flushMenuCache();

        return response()->json([
            'message' => 'Navigation items saved',
            'data' => $navigation,
        ]);
    }

    /**
     * The public site menus are cached; every builder write must drop the
     * cache so the next page load reflects the edit.
     */
    private function flushMenuCache(): void
    {
        app(\Core\Services\Contracts\PublicNavigationInterface::class)->flush();
    }
}
