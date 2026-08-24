<?php

namespace Core\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Http\Resources\BaseResource;
use Core\Repositories\Repository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

abstract class BaseController extends Controller
{
    abstract protected function repository(): Repository;

    abstract protected function resourceClass(): string;

    abstract protected function policyClass(): ?string;

    public function index(Request $request): JsonResource
    {
        $this->authorizeAction('viewAny');

        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);

        $results = $this->repository()->findMany(
            $this->buildQueryParams($request)
        );

        return $this->resourceClass()::collection($results->items)
            ->additional([
                'meta' => [
                    'total' => $results->total,
                    'page' => $results->page,
                    'per_page' => $results->perPage,
                    'total_pages' => $results->totalPages,
                ],
            ]);
    }

    public function show(string $id): JsonResource
    {
        $this->authorizeAction('view');

        $model = $this->repository()->findById($id);

        if (!$model) {
            abort(404, 'Resource not found');
        }

        return new ($this->resourceClass())($model);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeAction('create');

        $model = $this->repository()->create($request->validated());

        return (new ($this->resourceClass())($model))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, string $id): JsonResource
    {
        $this->authorizeAction('update');

        $model = $this->repository()->findById($id);

        if (!$model) {
            abort(404, 'Resource not found');
        }

        $updated = $this->repository()->update($id, $request->validated());

        return new ($this->resourceClass())($updated);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->authorizeAction('delete');

        $deleted = $this->repository()->delete($id);

        return response()->json([
            'message' => 'Resource deleted successfully',
            'deleted' => $deleted,
        ]);
    }

    protected function authorizeAction(string $ability): void
    {
        if ($policyClass = $this->policyClass()) {
            Gate::authorize($ability, $policyClass);
        }
    }

    protected function buildQueryParams(Request $request): array
    {
        $params = [];

        if ($request->has('page')) {
            $params['pagination'] = [
                'page' => (int) $request->input('page', 1),
                'perPage' => (int) $request->input('per_page', 15),
            ];
        }

        if ($request->has('sort_by')) {
            $params['sort'] = [
                ['field' => $request->input('sort_by'), 'direction' => $request->input('sort_dir', 'asc')],
            ];
        }

        if ($request->has('search')) {
            $params['search'] = $request->input('search');
            $params['searchFields'] = $request->input('search_fields', ['name']);
        }

        if ($request->has('filters')) {
            $params['filters'] = $request->input('filters');
        }

        return $params;
    }
}
