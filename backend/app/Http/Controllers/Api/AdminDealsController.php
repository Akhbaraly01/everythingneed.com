<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Controllers\AdminNeedsController;
use Modules\Needs\Entities\NeedItem;

/**
 * Deals console: every need listing, with public visibility controls.
 * Status moderation delegates to the canonical needs moderation workflow.
 */
class AdminDealsController extends Controller
{
    public function __construct(private AuditServiceInterface $audit) {}

    public function overview(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total' => NeedItem::count(),
                'live' => NeedItem::where('status', NeedItem::STATUS_PUBLISHED)
                    ->where('is_available', true)->count(),
                'hidden' => NeedItem::where(function ($q) {
                    $q->where('status', '!=', NeedItem::STATUS_PUBLISHED)
                        ->orWhere('is_available', false);
                })->count(),
                'categories' => NeedItem::distinct()->count('category_id'),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:all,' . implode(',', NeedItem::STATUSES)],
            'visibility' => ['nullable', 'string', 'in:all,live,hidden'],
            'category_id' => ['nullable', 'uuid'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = NeedItem::with(['category:id,name,slug', 'owner:id,name,email', 'vendor:id,store_name'])
            ->when(trim((string) ($validated['search'] ?? '')), function ($q, $search) {
                $q->where(function ($w) use ($search) {
                    $w->where('name', 'ilike', "%{$search}%")
                        ->orWhere('description', 'ilike', "%{$search}%");
                });
            })
            ->when(($validated['status'] ?? 'all') !== 'all', fn ($q) => $q->where('status', $validated['status']))
            ->when($validated['category_id'] ?? null, fn ($q, $id) => $q->where('category_id', $id));

        match ($validated['visibility'] ?? 'all') {
            'live' => $query->where('status', NeedItem::STATUS_PUBLISHED)->where('is_available', true),
            'hidden' => $query->where(function ($q) {
                $q->where('status', '!=', NeedItem::STATUS_PUBLISHED)->orWhere('is_available', false);
            }),
            default => null,
        };

        $paginated = $query->orderByDesc('created_at')->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function moderate(Request $request, string $id): JsonResponse
    {
        return app(AdminNeedsController::class)->listingsModerate($request, $id);
    }

    public function visibility(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $item = NeedItem::find($id);
        if (! $item) {
            return response()->json(['message' => 'Deal not found'], 404);
        }

        if ($validated['is_available'] && $item->status !== NeedItem::STATUS_PUBLISHED) {
            return response()->json(['message' => 'Only published deals can be made live'], 422);
        }

        $item->update(['is_available' => $validated['is_available']]);

        try {
            $this->audit->log([
                'action' => 'deal.visibility.' . ($validated['is_available'] ? 'shown' : 'hidden'),
                'entity_type' => 'need_item',
                'entity_id' => $item->id,
                'performed_by' => $request->user()->id,
                'new_values' => ['is_available' => $validated['is_available']],
            ]);
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => $validated['is_available'] ? 'Deal is live' : 'Deal hidden from the storefront',
            'data' => $item->fresh(),
        ]);
    }
}
