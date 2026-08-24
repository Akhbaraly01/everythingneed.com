<?php

namespace Core\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class BaseRepository implements Repository
{
    abstract protected function model(): Model;

    protected function newQuery(): Builder
    {
        return $this->model()->newQuery();
    }

    public function findById(string $id): ?object
    {
        return $this->newQuery()->find($id);
    }

    public function findMany(array $params = []): object
    {
        $query = $this->newQuery();

        if (!empty($params['filters'])) {
            foreach ($params['filters'] as $filter) {
                $query = $this->applyFilter($query, $filter);
            }
        }

        if (!empty($params['search']) && !empty($params['searchFields'])) {
            $query->where(function (Builder $q) use ($params) {
                foreach ($params['searchFields'] as $field) {
                    $q->orWhere($field, 'ilike', "%{$params['search']}%");
                }
            });
        }

        if (!empty($params['sort'])) {
            foreach ($params['sort'] as $sort) {
                $query->orderBy($sort['field'], $sort['direction'] ?? 'asc');
            }
        } else {
            $query->latest();
        }

        $perPage = $params['pagination']['perPage'] ?? 15;
        $page = $params['pagination']['page'] ?? 1;

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return (object) [
            'items' => $paginator->items(),
            'total' => $paginator->total(),
            'page' => $paginator->currentPage(),
            'perPage' => $paginator->perPage(),
            'totalPages' => $paginator->lastPage(),
        ];
    }

    public function create(array $data): object
    {
        return $this->model()->create($data);
    }

    public function update(string $id, array $data): object
    {
        $model = $this->findById($id);
        if (!$model) {
            throw new \Core\Exceptions\NotFoundException(get_class($this->model()), $id);
        }
        $model->update($data);
        return $model->fresh();
    }

    public function delete(string $id): bool
    {
        $model = $this->findById($id);
        if (!$model) {
            throw new \Core\Exceptions\NotFoundException(get_class($this->model()), $id);
        }
        return $model->delete();
    }

    public function exists(string $id): bool
    {
        return $this->newQuery()->where('id', $id)->exists();
    }

    public function count(array $filters = []): int
    {
        $query = $this->newQuery();
        foreach ($filters as $filter) {
            $query = $this->applyFilter($query, $filter);
        }
        return $query->count();
    }

    protected function applyFilter(Builder $query, array $filter): Builder
    {
        $field = $filter['field'] ?? '';
        $operator = $filter['operator'] ?? '=';
        $value = $filter['value'] ?? null;

        return match ($operator) {
            '!=' => $query->where($field, '!=', $value),
            '>' => $query->where($field, '>', $value),
            '<' => $query->where($field, '<', $value),
            '>=' => $query->where($field, '>=', $value),
            '<=' => $query->where($field, '<=', $value),
            'like' => $query->where($field, 'ilike', "%{$value}%"),
            'in' => $query->whereIn($field, (array) $value),
            'between' => $query->whereBetween($field, $value),
            default => $query->where($field, $value),
        };
    }
}
