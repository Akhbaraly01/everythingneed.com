<?php

namespace Modules\Vendors\Services;

use Modules\Vendors\Actions\RegisterVendor;
use Modules\Vendors\Actions\ApproveVendor;
use Modules\Vendors\Actions\SuspendVendor;
use Modules\Vendors\Entities\Vendor;

class VendorService
{
    public function __construct(
        private RegisterVendor $registerVendor,
        private ApproveVendor $approveVendor,
        private SuspendVendor $suspendVendor,
    ) {}

    public function register(string $userId, array $data): object
    {
        return $this->registerVendor->execute($userId, $data);
    }

    public function approve(string $vendorId): object
    {
        return $this->approveVendor->execute($vendorId);
    }

    public function suspend(string $vendorId, ?string $reason = null): object
    {
        return $this->suspendVendor->execute($vendorId, $reason);
    }

    public function getVendor(string $vendorId): ?Vendor
    {
        return Vendor::with(['user', 'products'])->find($vendorId);
    }

    public function getVendorByUserId(string $userId): ?Vendor
    {
        return Vendor::where('user_id', $userId)->first();
    }

    public function getVendors(array $filters = [], int $page = 1, int $perPage = 15): object
    {
        $query = Vendor::with(['user']);

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_verified'])) {
            $query->where('is_verified', $filters['is_verified']);
        }

        return $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
