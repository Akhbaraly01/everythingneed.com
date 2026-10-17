<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Healthcare\Entities\HealthContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HealthContentController extends Controller
{
    private const TYPES = [
        'videos' => 'video',
        'documents' => 'document',
        'categories' => 'category',
        'prevention-guides' => 'prevention_guide',
    ];

    public function index(Request $request, string $type): JsonResponse
    {
        $mapped = self::TYPES[$type] ?? null;

        if (!$mapped) {
            return response()->json(['message' => "Unknown health content type '{$type}'"], 404);
        }

        $query = HealthContent::where('type', $mapped)->where('is_active', true);

        if ($request->filled('specialty')) {
            $query->where('specialty', $request->specialty);
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('summary', 'ilike', "%{$q}%");
            });
        }

        $content = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $content->items(),
            'meta' => [
                'current_page' => $content->currentPage(),
                'last_page' => $content->lastPage(),
                'per_page' => $content->perPage(),
                'total' => $content->total(),
            ],
        ]);
    }

    public function show(string $type, string $id): JsonResponse
    {
        $mapped = self::TYPES[$type] ?? null;

        if (!$mapped) {
            return response()->json(['message' => "Unknown health content type '{$type}'"], 404);
        }

        $content = HealthContent::where('type', $mapped)->find($id);

        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        return response()->json(['data' => $content]);
    }

    /** GET /api/admin/healthcare/content - full library incl. inactive (Documentation hub management). */
    public function adminList(Request $request): JsonResponse
    {
        $query = HealthContent::orderByDesc('created_at');

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q
                ->where('title', 'ilike', "%{$search}%")
                ->orWhere('summary', 'ilike', "%{$search}%"));
        }

        return response()->json($query->paginate(20)->withQueryString());
    }

    /** POST /api/admin/healthcare/content - publish a library item. */
    public function adminStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|string|in:video,document,category,prevention_guide',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'summary' => 'nullable|string|max:2000',
            'body' => 'nullable|string|max:20000',
            'url' => 'nullable|url|max:2000',
            'thumbnail_url' => 'nullable|url|max:2000',
            'specialty' => 'nullable|string|max:100',
            'duration_minutes' => 'nullable|integer|min:0|max:10000',
            'is_active' => 'nullable|boolean',
        ]);

        $content = HealthContent::create([
            ...$data,
            'slug' => $data['slug'] ?? Str::slug($data['title']).'-'.Str::lower(Str::random(6)),
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Health content published',
            'data' => $content,
        ], 201);
    }

    /** PUT /api/admin/healthcare/content/{id} - edit or publish/unpublish. */
    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $content = HealthContent::find($id);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        $data = $request->validate([
            'type' => 'sometimes|string|in:video,document,category,prevention_guide',
            'title' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255',
            'summary' => 'nullable|string|max:2000',
            'body' => 'nullable|string|max:20000',
            'url' => 'nullable|url|max:2000',
            'thumbnail_url' => 'nullable|url|max:2000',
            'specialty' => 'nullable|string|max:100',
            'duration_minutes' => 'nullable|integer|min:0|max:10000',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($data === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        $content->update($data);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'update',
                'entity_type' => 'health_content',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => $data,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the update.
        }

        return response()->json([
            'message' => 'Health content updated',
            'data' => $content->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/healthcare/content/{id} - remove a library item.
     * Soft delete so historic deep links can still resolve via admin reads.
     * (role: super_admin, administrator, healthcare_admin)
     */
    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        $content = HealthContent::find($id);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        $title = $content->title;
        $content->delete();

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'delete',
                'entity_type' => 'health_content',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['title' => $title],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break deletion.
        }

        return response()->json(['message' => 'Health content deleted']);
    }
}
