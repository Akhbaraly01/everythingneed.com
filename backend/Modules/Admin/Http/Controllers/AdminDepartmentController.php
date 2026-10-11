<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\SupportQueryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Admin\Http\Requests\AdminDepartmentStoreRequest;
use Modules\Admin\Http\Requests\AdminDepartmentUpdateRequest;

/**
 * Departments are shared by support tickets and the healthcare console.
 */
class AdminDepartmentController extends Controller
{
    public function __construct(private SupportQueryInterface $support) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->support->departments()]);
    }

    public function store(AdminDepartmentStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $id = $this->support->createDepartment($validated);

        return response()->json([
            'message' => 'Department created',
            'data' => ['id' => $id],
        ], 201);
    }

    public function update(AdminDepartmentUpdateRequest $request, string $id): JsonResponse
    {
        $validated = $request->validated();

        if (! $this->support->updateDepartment($id, $validated)) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json(['message' => 'Department updated']);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($this->support->departmentInUse($id)) {
            return response()->json([
                'message' => 'Department is in use by existing tickets and cannot be deleted.',
                'error' => 'Reassign its tickets first.',
            ], 422);
        }

        if (! $this->support->deleteDepartment($id)) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json(['message' => 'Department deleted']);
    }
}
