<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Admin\Entities\HomePageSection;
use Modules\Admin\Http\Requests\HomeSectionStoreRequest;
use Modules\Admin\Http\Requests\HomeSectionUpdateRequest;

/**
 * HomePageSection admin console (Home rebuild).
 *
 * Admins reorder + toggle sections; only Super Admin creates/deletes
 * (delete is role-gated on the route, matching the rbac exclusivity
 * precedent). Order/visibility drives the storefront render sequence.
 */
class AdminHomeSectionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => HomePageSection::ordered()->get(),
        ]);
    }

    public function store(HomeSectionStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        $section = HomePageSection::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'is_active' => $data['is_active'] ?? true,
            'order' => $data['order'] ?? ((int) HomePageSection::max('order') + 1),
        ]);

        return response()->json([
            'message' => 'Home section created',
            'data' => $section->fresh(),
        ], 201);
    }

    public function update(HomeSectionUpdateRequest $request, string $id): JsonResponse
    {
        $section = HomePageSection::find($id);

        if (! $section) {
            return response()->json(['message' => 'Home section not found'], 404);
        }

        $section->fill($request->validated());
        $section->save();

        return response()->json([
            'message' => 'Home section updated',
            'data' => $section->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $section = HomePageSection::find($id);

        if (! $section) {
            return response()->json(['message' => 'Home section not found'], 404);
        }

        $section->delete();

        return response()->json(['message' => 'Home section deleted']);
    }

    /**
     * Persist the admin drag/drop (or up/down) sequence in one call.
     * Body: { order: [<uuid>, <uuid>, ...] } — unknown ids are ignored,
     * omitted rows keep their relative tail position.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order' => 'required|array|min:1|max:200',
            'order.*' => 'string',
        ]);

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['order']) as $position => $id) {
                HomePageSection::where('id', $id)->update([
                    'order' => $position + 1,
                    'updated_at' => now(),
                ]);
            }
        });

        return response()->json([
            'message' => 'Home section order updated',
            'data' => HomePageSection::ordered()->get(),
        ]);
    }
}
