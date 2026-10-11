<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\VendorQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AdminVendorController
 *
 * Handles vendor management for the admin control center.
 * All routes require auth:sanctum + manageVendors gate.
 */
class AdminVendorController extends Controller
{
    public function __construct(private VendorQueryInterface $vendors) {}

    /**
     * Paginated list of vendors with filters.
     *
     * GET /api/admin/vendors
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', 'string', 'in:all,pending,verified'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json($this->vendors->paginate($validated));
    }

    /**
     * Returns full vendor detail.
     *
     * GET /api/admin/vendors/{id}
     */
    public function show(string $id): JsonResponse
    {
        $vendor = $this->vendors->find($id);

        if (! $vendor) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        return response()->json(['data' => $vendor]);
    }

    /**
     * Approves a vendor (sets is_verified = true).
     *
     * POST /api/admin/vendors/{id}/approve
     */
    public function approve(string $id): JsonResponse
    {
        return $this->decide($id, true, 'approve', 'Vendor approved');
    }

    /**
     * Rejects a vendor application (sets is_verified = false).
     *
     * POST /api/admin/vendors/{id}/reject
     */
    public function reject(string $id): JsonResponse
    {
        return $this->decide($id, false, 'update', 'Vendor application rejected');
    }

    /**
     * Suspends an active vendor.
     *
     * POST /api/admin/vendors/{id}/suspend
     */
    public function suspend(string $id): JsonResponse
    {
        return $this->decide($id, false, 'update', 'Vendor suspended');
    }

    /**
     * Restores a suspended vendor.
     *
     * POST /api/admin/vendors/{id}/restore
     */
    public function restore(string $id): JsonResponse
    {
        return $this->decide($id, true, 'update', 'Vendor restored');
    }

    /**
     * Shared decision helper (verification flip + audit logging).
     */
    private function decide(string $id, bool $verified, string $action, string $details): JsonResponse
    {
        if (! $this->vendors->setVerified($id, $verified, $action, $details)) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        return response()->json(['message' => $details]);
    }
}
