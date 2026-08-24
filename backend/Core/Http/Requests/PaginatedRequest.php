<?php

namespace Core\Http\Requests;

class PaginatedRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string',
            'sort_dir' => 'nullable|in:asc,desc',
            'search' => 'nullable|string|max:255',
            'search_fields' => 'nullable|array',
            'search_fields.*' => 'string',
            'filters' => 'nullable|array',
        ];
    }
}
