<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * AdminVendorController
 *
 * Handles vendor management for the admin control center.
 * All routes require auth:sanctum + manageVendors gate.
 */
class AdminVendorController extends Controller
{
    /**
     * Paginated list of vendors with filters.
     *
     * GET /api/admin/vendors
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', 'string', 'in:all,pending,verified,suspended'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $query = DB::table('vendors')
            ->whereNull('deleted_at')
            ->select(['id', 'store_name', 'category', 'is_verified', 'created_at']);

        if (! empty($validated['search'])) {
            $term = '%' . $validated['search'] . '%';
            $query->where(fn ($q) => $q->where('store_name', 'like', $term)->orWhere('category', 'like', $term));
        }

        $status = $validated['status'] ?? 'all';
        match ($status) {
            'pending'   => $query->where('is_verified', false),
            'verified'  => $query->where('is_verified', true),
            'suspended' => $query->whereRaw('1 = 0'),
            default     => null,
        };

        $perPage = (int) ($validated['per_page'] ?? 20);
        $page    = (int) ($validated['page'] ?? 1);
        $total   = $query->count();
        $vendors = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return response()->json([
            'data' => $vendors,
            'meta' => ['total' => $total, 'page' => $page, 'per_page' => $perPage],
        ]);
    }

    /**
     * Returns full vendor detail.
     *
     * GET /api/admin/vendors/{id}
     */
    public function show(string $id): JsonResponse
    {
        $vendor = DB::table('vendors')->where('id', $id)->whereNull('deleted_at')->first();

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
        return $this->updateVendor($id, ['is_verified' => true], 'approve', 'Vendor approved');
    }

    /**
     * Rejects a vendor application (sets is_verified = false).
     *
     * POST /api/admin/vendors/{id}/reject
     */
    public function reject(string $id): JsonResponse
    {
        return $this->updateVendor($id, ['is_verified' => false], 'update', 'Vendor application rejected');
    }

    /**
     * Suspends an active vendor.
     *
     * POST /api/admin/vendors/{id}/suspend
     */
    public function suspend(string $id): JsonResponse
    {
        return $this->updateVendor($id, ['is_verified' => false], 'update', 'Vendor suspended');
    }

    /**
     * Restores a suspended vendor.
     *
     * POST /api/admin/vendors/{id}/restore
     */
    public function restore(string $id): JsonResponse
    {
        return $this->updateVendor($id, ['is_verified' => true], 'update', 'Vendor restored');
    }

    /**
     * Shared update helper with audit logging.
     *
     * @param  array<string, mixed>  $data
     */
    private function updateVendor(string $id, array $data, string $action, string $details): JsonResponse
    {
        $affected = DB::table('vendors')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->update(array_merge($data, ['updated_at' => now()]));

        if (! $affected) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        $this->logAudit($action, 'vendor', $id, $details);

        return response()->json(['message' => $details]);
    }

    /**
     * Writes an audit log entry.
     */
    private function logAudit(string $action, string $entityType, string $entityId, string $details): void
    {
        try {
            DB::table('audit_logs')->insert([
                'id'           => Str::uuid()->toString(),
                'action'       => $action,
                'entity_type'  => $entityType,
                'entity_id'    => $entityId,
                'new_values'   => json_encode(['details' => $details]),
                'performed_by' => auth()->id(),
                'created_at'   => now(),
            ]);
        } catch (Throwable) {
            // Audit failures must not break responses
        }
    }
}
