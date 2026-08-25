<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Departments are shared by support tickets and the healthcare console.
 */
class AdminDepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $departments = DB::table('departments')
            ->leftJoin('tickets', 'tickets.department_id', '=', 'departments.id')
            ->select(
                'departments.id',
                'departments.name',
                'departments.description',
                'departments.created_at',
                DB::raw('count(tickets.id) as tickets_count'),
            )
            ->groupBy('departments.id')
            ->orderBy('departments.name')
            ->get();

        return response()->json(['data' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('departments', 'name')->whereNull('deleted_at')],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $id = (string) \Illuminate\Support\Str::uuid();

        DB::table('departments')->insert([
            'id' => $id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Department created',
            'data' => ['id' => $id],
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes', 'required', 'string', 'max:120',
                Rule::unique('departments', 'name')
                    ->whereNull('deleted_at')
                    ->ignore($id),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $exists = DB::table('departments')->where('id', $id)->whereNull('deleted_at')->exists();

        if (!$exists) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        DB::table('departments')
            ->where('id', $id)
            ->update(array_merge($validated, ['updated_at' => now()]));

        return response()->json(['message' => 'Department updated']);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $referenced = DB::table('tickets')->where('department_id', $id)->exists();

        if ($referenced) {
            return response()->json([
                'message' => 'Department is in use by existing tickets and cannot be deleted.',
                'error' => 'Reassign its tickets first.',
            ], 422);
        }

        $deleted = DB::table('departments')->where('id', $id)->delete();

        if (!$deleted) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        return response()->json(['message' => 'Department deleted']);
    }
}
