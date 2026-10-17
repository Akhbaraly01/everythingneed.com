<?php

namespace Modules\Needs\Services;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;

/**
 * N-31 saved-search alerts: applies a saved-search query payload to the
 * open marketplace scope (same filters as NeedRequestController::index with
 * scope=open, minus pagination/sort). Used by the AlertSavedSearches
 * command to find new public requests matching a provider's saved search.
 */
class SavedSearchMatcher
{
    /**
     * @param array<string, mixed> $query Decoded query payload from need_saved_items.query
     * @param string|null $cursor ISO-8601 timestamp; only requests created after this are considered
     * @param string|null $viewerId The searching user's id (for invited-provider visibility)
     * @return array<int, NeedRequest>
     */
    public function match(array $query, ?string $cursor = null, ?string $viewerId = null): array
    {
        $builder = NeedRequest::query()
            ->whereIn('status', NeedRequest::OPEN_STATUSES)
            ->where(function ($w) use ($viewerId) {
                $w->where('visibility', NeedRequest::VISIBILITY_PUBLIC);
                if ($viewerId !== null) {
                    $w->orWhereJsonContains('invited_provider_ids', $viewerId);
                }
            });

        if ($cursor !== null) {
            $builder->where('created_at', '>', $cursor);
        }

        if (! empty($query['category_id'])) {
            $builder->where('category_id', $query['category_id']);
        }

        if (! empty($query['category_slug'])) {
            $category = NeedCategory::where('slug', $query['category_slug'])->first();
            $builder->where('category_id', $category?->id);
        }

        if (! empty($query['q'])) {
            $q = (string) $query['q'];
            $builder->where(function ($sub) use ($q) {
                $sub->where('title', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        if (! empty($query['budget_min'])) {
            $builder->where('budget_max', '>=', (float) $query['budget_min']);
        }

        if (! empty($query['budget_max'])) {
            $max = (float) $query['budget_max'];
            $builder->where(function ($w) use ($max) {
                $w->where('budget_min', '<=', $max)
                    ->orWhere(function ($n) {
                        $n->whereNull('budget_min')->whereNull('budget_max');
                    });
            });
        }

        foreach (['state', 'city'] as $geo) {
            if (! empty($query[$geo])) {
                $builder->where($geo, 'ilike', '%'.$query[$geo].'%');
            }
        }

        if (array_key_exists('is_remote', $query) && $query['is_remote'] !== null) {
            $builder->where('is_remote', (bool) $query['is_remote']);
        }

        if (! empty($query['pricing_basis'])) {
            $builder->where('pricing_basis', $query['pricing_basis']);
        }

        return $builder->orderByDesc('created_at')->limit(50)->get()->all();
    }
}