<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\ProductQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\Products\Entities\Product;
use Modules\Vendors\Services\VendorQueryService;

/**
 * Agriculture console: products, farmer stores, and farm worker profiles.
 * All routes are permission-gated in Modules/Admin/Routes/api.php.
 */
class AdminAgricultureController extends Controller
{
    public function __construct(
        private ProductQueryInterface $products,
        private VendorQueryService $vendors,
        private AuditServiceInterface $audit,
    ) {}

    public function overview(): JsonResponse
    {
        return response()->json([
            'data' => [
                'products_total' => Product::where('category', 'ilike', '%agric%')->count(),
                'products_pending' => Product::where('category', 'ilike', '%agric%')
                    ->whereNull('approved_at')->count(),
                'products_published' => Product::where('category', 'ilike', '%agric%')
                    ->whereNotNull('approved_at')->where('is_active', true)
                    ->where('publication_state', 'published')->count(),
                'farmers_total' => DB::table('vendors')
                    ->whereNull('deleted_at')->where('category', 'ilike', '%agric%')->count(),
                'farmers_verified' => DB::table('vendors')
                    ->whereNull('deleted_at')->where('category', 'ilike', '%agric%')
                    ->where('is_verified', true)->count(),
                'workers_total' => $this->workerScope(WorkerProfile::query())->count(),
                'workers_verified' => $this->workerScope(WorkerProfile::query())
                    ->where('is_verified', true)->count(),
            ],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:all,pending,published,hidden,archived'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = Product::with('vendor:id,store_name')->where('category', 'ilike', '%agric%');

        if ($search = trim((string) ($validated['search'] ?? ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('sku', 'ilike', "%{$search}%")
                    ->orWhereHas('vendor', fn ($vendor) => $vendor->where('store_name', 'ilike', "%{$search}%"));
            });
        }

        match ($validated['status'] ?? 'all') {
            'pending' => $query->whereNull('approved_at'),
            'published' => $query->whereNotNull('approved_at')
                ->where('is_active', true)
                ->where('publication_state', 'published'),
            'hidden' => $query->where(function ($q) {
                $q->where('is_active', false)
                    ->orWhereIn('publication_state', ['hidden', 'draft']);
            }),
            'archived' => $query->where('publication_state', 'archived'),
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

    public function moderateProduct(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:1000', 'required_if:action,reject'],
        ]);

        $product = Product::withTrashed()->find($id);
        if (! $product || ! $this->isAgriculture($product->category)) {
            return response()->json(['message' => 'Agriculture product not found'], 404);
        }

        $updated = $this->products->decide(
            $id,
            $validated['action'] === 'approve',
            $validated['reason'] ?? null,
        );

        if (! $updated) {
            return response()->json(['message' => 'Agriculture product not found'], 404);
        }

        return response()->json([
            'message' => $validated['action'] === 'approve' ? 'Product approved and published' : 'Product rejected',
            'data' => $updated->load('vendor:id,store_name'),
        ]);
    }

    public function farmers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'in:all,pending,verified'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = DB::table('vendors as v')
            ->leftJoin('users as u', 'u.id', '=', 'v.user_id')
            ->whereNull('v.deleted_at')
            ->where('v.category', 'ilike', '%agric%')
            ->select([
                'v.id', 'v.store_name', 'v.category', 'v.is_verified', 'v.created_at',
                'u.name as user_name', 'u.email as user_email',
                DB::raw('(SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) as total_products'),
            ]);

        if ($search = trim((string) ($validated['search'] ?? ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('v.store_name', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%")
                    ->orWhere('u.email', 'ilike', "%{$search}%");
            });
        }

        match ($validated['status'] ?? 'all') {
            'pending' => $query->where('v.is_verified', false),
            'verified' => $query->where('v.is_verified', true),
            default => null,
        };

        $perPage = (int) ($validated['per_page'] ?? 20);
        $page = (int) ($validated['page'] ?? 1);
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('v.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => ['current_page' => $page, 'last_page' => max(1, (int) ceil($total / $perPage)), 'per_page' => $perPage, 'total' => $total],
        ]);
    }

    public function moderateFarmer(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:verify,unverify'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $exists = DB::table('vendors')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->where('category', 'ilike', '%agric%')
            ->exists();

        if (! $exists) {
            return response()->json(['message' => 'Agriculture farmer not found'], 404);
        }

        $verified = $validated['action'] === 'verify';
        if (! $this->vendors->setVerified($id, $verified, 'agriculture.farmer.' . $validated['action'], $validated['note'] ?? null)) {
            return response()->json(['message' => 'Agriculture farmer not found'], 404);
        }

        return response()->json([
            'message' => $verified ? 'Farmer verified' : 'Farmer verification removed',
        ]);
    }

    public function workers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'availability' => ['nullable', 'string', 'in:available,busy,unavailable'],
            'verified' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = $this->workerScope(WorkerProfile::query())
            ->with('user:id,name,email')
            ->withCount('workRequests');

        if ($search = trim((string) ($validated['search'] ?? ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('headline', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%")
                    ->orWhere('city', 'ilike', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user
                        ->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%"));
            });
        }

        if (($validated['availability'] ?? null) !== null) {
            $query->where('availability', $validated['availability']);
        }

        if (array_key_exists('verified', $validated)) {
            $query->where('is_verified', (bool) $validated['verified']);
        }

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

    public function moderateWorker(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:verify,unverify'],
        ]);

        $worker = $this->workerScope(WorkerProfile::query())->find($id);
        if (! $worker) {
            return response()->json(['message' => 'Farm worker not found'], 404);
        }

        $verified = $validated['action'] === 'verify';
        $worker->update(['is_verified' => $verified]);

        try {
            $this->audit->log([
                'action' => 'agriculture.worker.' . $validated['action'],
                'entity_type' => 'worker_profile',
                'entity_id' => $worker->id,
                'performed_by' => $request->user()->id,
                'new_values' => ['is_verified' => $verified],
            ]);
        } catch (\Throwable) {
        }

        return response()->json([
            'message' => $verified ? 'Farm worker verified' : 'Farm worker verification removed',
            'data' => $worker->fresh()->load('user:id,name,email'),
        ]);
    }

    private function workerScope($query)
    {
        return $query->where(function ($q) {
            $q->where('category', 'ilike', '%agric%')
                ->orWhere('category', 'ilike', '%farm%');
        });
    }

    private function isAgriculture(?string $category): bool
    {
        return str_contains(mb_strtolower((string) $category), 'agric');
    }
}
