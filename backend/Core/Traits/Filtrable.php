<?php

namespace Core\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Filtrable
{
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        foreach ($filters as $field => $value) {
            if (is_array($value)) {
                $operator = $value['operator'] ?? '=';
                $query->where($field, $operator, $value['value'] ?? $value);
            } else {
                $query->where($field, '=', $value);
            }
        }
        return $query;
    }

    public function scopeSearch(Builder $query, ?string $search, array $columns): Builder
    {
        if (!$search) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search, $columns) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'ilike', "%{$search}%");
            }
        });
    }
}
