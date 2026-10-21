<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\PermissionServiceInterface;
use Core\Services\Contracts\ProductQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProductApprovalController extends Controller
{
    public function __construct(
        private ProductQueryInterface $products,
        private PermissionServiceInterface $permissions,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        return response()->json(
            $this->products->pending(
                (int) $request->get('per_page', 20),
                $this->scope($request),
            )
        );
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->decide($request, $id, true);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->decide($request, $id, false, $validated['reason'] ?? null);
    }

    /**
     * Bulk moderation: approve or reject many products in one request
     * (the console toolbar). Out-of-scope ids are skipped, never failed.
     */
    public function bulk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'string', 'max:64'],
            'action' => ['required', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $approve = $validated['action'] === 'approve';
        $result = $this->products->decideMany(
            $validated['ids'],
            $approve,
            $validated['reason'] ?? null,
            $this->scope($request),
        );

        return response()->json([
            'message' => $approve
                ? "{$result['processed']} product(s) approved"
                : "{$result['processed']} product(s) rejected",
            'data' => $result,
        ]);
    }

    /**
     * Server-side category scope for the caller (super_admin/administrator
     * and non-category viewers get null = unrestricted; a scoped
     * marketplace_admin is confined to products.category).
     */
    private function scope(Request $request): ?string
    {
        $user = $request->user();

        return $user ? $this->permissions->productCategoryScope($user->id) : null;
    }

    private function decide(Request $request, string $id, bool $approve, ?string $reason = null): JsonResponse
    {
        $product = $this->products->decide($id, $approve, $reason, $this->scope($request));

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json([
            'message' => $approve ? 'Product approved and published' : 'Product rejected',
            'data' => $product,
        ]);
    }
}
