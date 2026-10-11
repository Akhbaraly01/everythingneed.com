<?php

namespace Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Users\Services\UserService;
use Modules\Users\Http\Requests\UpdateProfileRequest;
use Modules\Users\Http\Requests\AddAddressRequest;
use Modules\Users\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Core\Services\Contracts\ReportingServiceInterface;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private ReportingServiceInterface $reporting,
    ) {}

    public function show(Request $request, string $id): JsonResponse
    {
        $me = $request->user();
        if ($me->id !== $id && !$me->hasPermission('users.users.view')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = $this->userService->getUser($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->getUsers(
            $request->only(['search', 'role']),
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $profile = $this->userService->updateProfile(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $profile,
        ]);
    }

    public function addAddress(AddAddressRequest $request): JsonResponse
    {
        $address = $this->userService->addAddress(
            $request->user()->id,
            $request->validated()
        );

        return response()->json([
            'message' => 'Address added successfully',
            'data' => $address,
        ], 201);
    }

    public function indexAddresses(Request $request): JsonResponse
    {
        $addresses = \Modules\Users\Entities\Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $addresses]);
    }

    public function setDefaultAddress(Request $request, string $id): JsonResponse
    {
        $address = \Modules\Users\Entities\Address::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        \Modules\Users\Entities\Address::where('user_id', $request->user()->id)
            ->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json(['message' => 'Default address updated', 'data' => $address->fresh()]);
    }

    public function deleteAddress(Request $request, string $id): JsonResponse
    {
        $address = \Modules\Users\Entities\Address::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$address) {
            return response()->json(['message' => 'Address not found'], 404);
        }

        $wasDefault = (bool) $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = \Modules\Users\Entities\Address::where('user_id', $request->user()->id)
                ->orderBy('created_at')
                ->first();
            $next?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->reporting->userStats($request->user()->id));
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $this->userService->deleteAccount($request->user()->id, $request->input('password'));

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}
