<?php

namespace Modules\Vendors\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Vendors\Services\VendorService;
use Modules\Vendors\Http\Requests\RegisterVendorRequest;
use Modules\Vendors\Http\Resources\VendorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function __construct(
        private VendorService $vendorService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $vendors = $this->vendorService->getVendors(
            $request->only(['category', 'is_verified']),
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => VendorResource::collection($vendors->items()),
            'meta' => [
                'current_page' => $vendors->currentPage(),
                'last_page' => $vendors->lastPage(),
                'per_page' => $vendors->perPage(),
                'total' => $vendors->total(),
            ],
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $vendor = $this->vendorService->getVendorByUserId($request->user()->id);

        if (!$vendor) {
            return response()->json([
                'message' => 'No vendor profile found',
                'error' => 'You do not have a vendor profile yet.',
            ], 404);
        }

        return response()->json([
            'data' => new VendorResource($vendor),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $vendor = $this->vendorService->getVendor($id);

        if (!$vendor) {
            return response()->json(['message' => 'Vendor not found'], 404);
        }

        return response()->json([
            'data' => new VendorResource($vendor),
        ]);
    }

    public function store(RegisterVendorRequest $request): JsonResponse
    {
        $vendor = $this->vendorService->register(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Vendor registered successfully',
            'data' => new VendorResource($vendor),
        ], 201);
    }

    public function approve(string $id): JsonResponse
    {
        $vendor = $this->vendorService->approve($id);

        return response()->json([
            'message' => 'Vendor approved successfully',
            'data' => new VendorResource($vendor),
        ]);
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $vendor = $this->vendorService->suspend($id, $request->get('reason'));

        return response()->json([
            'message' => 'Vendor suspended successfully',
            'data' => new VendorResource($vendor),
        ]);
    }
}
