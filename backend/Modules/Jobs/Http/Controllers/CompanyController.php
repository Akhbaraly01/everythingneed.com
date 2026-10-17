<?php

namespace Modules\Jobs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Modules\Jobs\Entities\Company;

/**
 * N-32 company profiles. One profile per owner in v1: `GET/PUT
 * /api/company` address the caller's own row (409 on a second create),
 * `GET /api/companies/{slug}` is the public page. Slugs are assigned once
 * — from the name, unique even against soft-deleted rows — so links never
 * break on rename.
 */
class CompanyController extends Controller
{
    private function own(Request $request): ?Company
    {
        return Company::where('user_id', $request->user()->id)->first();
    }

    public function showOwn(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->own($request)]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($this->own($request)) {
            return response()->json(['message' => 'You already have a company profile; edit it instead'], 409);
        }

        $validated = $this->validatePayload($request);

        $company = Company::create(array_merge($validated, [
            'user_id' => $request->user()->id,
            'slug' => $this->uniqueSlug($validated['name']),
            'is_active' => true,
        ]));

        return response()->json([
            'message' => 'Company profile created',
            'data' => $company,
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $company = $this->own($request);

        if (! $company) {
            return response()->json(['message' => 'No company profile to update'], 404);
        }

        $validated = $this->validatePayload($request, updating: true);

        // name may change; the slug (public link) never does.
        $company->update($validated);

        return response()->json([
            'message' => 'Company profile updated',
            'data' => $company->fresh(),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $company = $this->own($request);

        if (! $company) {
            return response()->json(['message' => 'No company profile to remove'], 404);
        }

        $company->update(['is_active' => false]);
        $company->delete();

        return response()->json(['message' => 'Company profile removed']);
    }

    /** Public company page: active profiles only, with live job posts. */
    public function publicProfile(string $slug): JsonResponse
    {
        $company = Company::where('slug', $slug)
            ->where('is_active', true)
            ->with(['jobs' => fn ($q) => $q->latest()->limit(50)])
            ->first();

        if (! $company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        return response()->json(['data' => $company]);
    }

    private function validatePayload(Request $request, bool $updating = false): array
    {
        $rule = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'name' => "{$rule}|string|min:2|max:120",
            'description' => 'nullable|string|max:5000',
            'website' => 'nullable|url|max:255',
            'industry' => 'nullable|string|max:120',
            'company_size' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'logo_path' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $base = $base !== '' ? $base : 'company';

        $slug = $base;
        $i = 2;
        while (Company::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
