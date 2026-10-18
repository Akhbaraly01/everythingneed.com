<?php

namespace Modules\Services\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Services\Entities\ServiceCategory;
use Modules\Services\Entities\ServiceDefinition;

/**
 * Mega-phase M-1: service taxonomy console (roots + subcategories + icons),
 * mirroring the needs category console contract. Only truly unused rows are
 * deletable; rows in use must be deactivated instead.
 */
class AdminServiceCategoryController extends Controller
{
    /** GET /api/admin/service-categories - full tree incl. inactive. */
    public function index(): JsonResponse
    {
        $categories = ServiceCategory::with([
            'parent:id,name,slug',
            'children' => fn ($q) => $q->orderBy('sort_order'),
        ])
            ->withCount(['services as services_count', 'children as children_count'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /** POST /api/admin/service-categories */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:service_categories,slug'],
            'description' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:service_categories,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = ServiceCategory::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'wrench',
            'color' => $validated['color'] ?? '#6366F1',
            'sort_order' => $validated['sort_order'] ?? 0,
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['message' => 'Category created', 'data' => $category], 201);
    }

    /** PUT /api/admin/service-categories/{id} */
    public function update(Request $request, string $id): JsonResponse
    {
        $category = ServiceCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'slug' => ['sometimes', 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:service_categories,slug,'.$category->id],
            'description' => ['nullable', 'string', 'max:2000'],
            'icon' => ['nullable', 'string', 'max:60'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:service_categories,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== null) {
            if ($validated['parent_id'] === $category->id || $this->isDescendantOf($validated['parent_id'], $category->id)) {
                return response()->json(['message' => 'A category cannot live under itself or its own child'], 422);
            }
        }

        $category->update($validated);

        // Keep the legacy display string aligned when the taxonomy changes so
        // old filters/search keep matching.
        if (array_key_exists('name', $validated)) {
            ServiceDefinition::where('category_id', $category->id)
                ->update(['category' => $category->name]);
        }

        return response()->json(['message' => 'Category updated', 'data' => $category->fresh()]);
    }

    /**
     * DELETE /api/admin/service-categories/{id}
     *
     * Soft-deletes. Rows with live services or children are protected
     * (deactivate instead).
     */
    public function destroy(string $id): JsonResponse
    {
        $category = ServiceCategory::find($id);
        if (! $category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $services = ServiceDefinition::where('category_id', $id)->count();
        $children = ServiceCategory::where('parent_id', $id)->count();

        if ($services > 0 || $children > 0) {
            return response()->json([
                'message' => 'Category is in use; deactivate it instead of deleting',
                'data' => ['services' => $services, 'children' => $children],
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    /** True when $candidateId sits somewhere below $ancestorId. */
    private function isDescendantOf(string $candidateId, string $ancestorId): bool
    {
        $current = ServiceCategory::find($candidateId);
        $guard = 0;

        while ($current && $guard < 20) {
            if ($current->parent_id === $ancestorId) {
                return true;
            }
            $current = $current->parent_id ? ServiceCategory::find($current->parent_id) : null;
            $guard++;
        }

        return false;
    }
}
