<?php

namespace Modules\Categories\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Categories\Entities\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(
        private \Core\Services\Contracts\PermissionServiceInterface $permissions,
    ) {}
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('children');

        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        } elseif (!$request->boolean('all')) {
            $query->whereNull('parent_id');
        }

        if ($request->has('search')) {
            $query->where('name', 'ilike', "%{$request->search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['data' => $categories]);
    }

    public function tree(): JsonResponse
    {
        $categories = Category::with('children.children.children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /** Resolves by canonical slug first; UUID ids still work (legacy links). */
    public function show(string $id): JsonResponse
    {
        $category = Category::with(['children', 'parent'])
            ->where(function ($query) use ($id) {
                $query->where('slug', $id);

                if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
                    $query->orWhere('id', $id);
                }
            })
            ->first();

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json(['data' => $category]);
    }

    /**
     * Scope guard for scoped marketplace admins (master-plan T).
     * Returns null when the action is allowed, or a 403 response payload.
     */
    private function scopeDenial(Request $request, ?string $targetCategoryId): ?JsonResponse
    {
        $scope = $this->permissions->managedCategoryId($request->user()->id);

        if ($scope === null) {
            return null;
        }

        if ($targetCategoryId === null || ! $this->permissions->withinManagedScope($targetCategoryId, $scope)) {
            return response()->json(['message' => 'Outside your assigned category scope.'], 403);
        }

        return null;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:100',
            'image_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        // Scoped admins may only create inside their own subtree.
        if ($denied = $this->scopeDenial($request, $validated['parent_id'] ?? null)) {
            return $denied;
        }

        $data = $request->only([
            'name', 'description', 'meta_title', 'meta_description', 'meta_keywords',
            'parent_id', 'icon', 'image_url', 'sort_order', 'is_active',
        ]);
        $data['slug'] = $this->uniqueSlug((string) Str::slug($data['name']));

        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        $category = Category::create($data);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        if ($denied = $this->scopeDenial($request, (string) $category->id)) {
            return $denied;
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'icon' => 'nullable|string|max:100',
            'image_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $data = $request->only([
            'name', 'description', 'meta_title', 'meta_description', 'meta_keywords',
            'parent_id', 'icon', 'image_url', 'sort_order', 'is_active',
        ]);

        // No cycles: a category can never become its own descendant.
        if (array_key_exists('parent_id', $data) && $data['parent_id'] !== null) {
            if ((string) $data['parent_id'] === (string) $category->id || $this->isDescendant((string) $data['parent_id'], (string) $category->id)) {
                return response()->json(['message' => 'A category cannot be nested under itself or its own child.'], 422);
            }
            // Reparenting must stay inside the admin's scope as well.
            if ($denied = $this->scopeDenial($request, (string) $data['parent_id'])) {
                return $denied;
            }
        }

        if (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = $this->uniqueSlug((string) Str::slug($data['name']), $category->id);
        }

        $category->update($data);

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        if ($denied = $this->scopeDenial($request, (string) $category->id)) {
            return $denied;
        }

        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Cannot delete category with children. Remove children first.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }

    /**
     * Slug collisions (same name under the same parent) get a numeric suffix
     * instead of tripping the unique index.
     */
    private function uniqueSlug(string $slug, ?string $ignoreId = null): string
    {
        $slug = $slug !== '' ? $slug : 'category';
        $candidate = $slug;
        $suffix = 2;

        while (
            Category::withTrashed()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $slug . '-' . $suffix++;
        }

        return $candidate;
    }

    /** Walks up from a candidate parent; true when it reaches $categoryId. */
    private function isDescendant(string $candidateParentId, string $categoryId): bool
    {
        $cursor = $candidateParentId;
        $guard = 0;

        while ($cursor !== null && $guard++ < 20) {
            if ((string) $cursor === $categoryId) {
                return true;
            }
            $cursor = Category::withTrashed()->where('id', $cursor)->value('parent_id');
        }

        return false;
    }
}
