<?php

namespace Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Users\Services\UserService;
use Modules\Users\Http\Requests\UpdateProfileRequest;
use Modules\Users\Http\Requests\AddAddressRequest;
use Modules\Users\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

    public function show(string $id): JsonResponse
    {
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

    public function destroy(Request $request): JsonResponse
    {
        $this->userService->deleteAccount($request->user()->id);

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}
