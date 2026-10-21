<?php

namespace Modules\Reviews\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\Products\Entities\Product;
use Modules\Products\Entities\ProductReview;
use Modules\Reviews\Entities\Review;

/**
 * One public read model for product reviews.
 *
 * Customer reviews are written to `reviews` (where they are moderated) and
 * mirrored into the catalogue's `product_reviews` projection. The product
 * page, the vendor page and the vendor console all read this feed, so every
 * surface publishes exactly the rows the reviews API (/api/reviews) does -
 * a mirrored row whose review was hidden, rejected or deleted never shows
 * up on its own.
 */
class ProductReviewFeed
{
    public function forProduct(string $productId, int $perPage = 10): LengthAwarePaginator
    {
        return $this->paginate([$productId], $perPage);
    }

    /**
     * @param  array<int, string>  $productIds
     */
    public function forProducts(array $productIds, int $perPage = 10): LengthAwarePaginator
    {
        return $this->paginate(array_values(array_unique(array_filter($productIds))), $perPage);
    }

    /**
     * @param  array<int, string>  $productIds
     */
    private function paginate(array $productIds, int $perPage): LengthAwarePaginator
    {
        if ($productIds === []) {
            return new LengthAwarePaginator([], 0, $perPage, 1);
        }

        $productNames = Product::whereIn('id', $productIds)->pluck('name', 'id');

        $rows = Review::query()
            ->where('reviewable_type', 'product')
            ->whereIn('reviewable_id', $productIds)
            ->whereIn('status', Review::VISIBLE_STATUSES)
            ->with('user:id,name')
            ->get()
            ->map(fn (Review $review) => $this->row(
                $review->id,
                $review->reviewable_id,
                $review->user_id,
                $review->rating,
                $review->comment,
                $review->created_at,
                $review->user?->name,
                $productNames[$review->reviewable_id] ?? null,
            ));

        $rows = $rows->concat($this->legacyRows($productIds, $productNames));

        $rows = $rows->sortByDesc(fn (array $row) => $row['created_at']->getTimestamp())->values();

        $page = LengthAwarePaginator::resolveCurrentPage();

        return new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath()]
        );
    }

    /**
     * Rows written straight into the catalogue projection (before the review
     * feed existed). They are published only when no review row owns them,
     * so a mirrored row is never counted twice.
     *
     * @param  array<int, string>  $productIds
     * @param  Collection<string, string>  $productNames
     * @return Collection<int, array<string, mixed>>
     */
    private function legacyRows(array $productIds, Collection $productNames): Collection
    {
        $mirrorIds = ProductReview::whereIn('product_id', $productIds)->pluck('id');

        $mirroredIds = $mirrorIds->isEmpty()
            ? collect()
            : Review::withTrashed()->whereIn('id', $mirrorIds)->pluck('id');

        $query = ProductReview::whereIn('product_id', $productIds);

        if ($mirroredIds->isNotEmpty()) {
            $query->whereNotIn('id', $mirroredIds->all());
        }

        return $query->with('user:id,name')->get()->map(fn (ProductReview $mirror) => $this->row(
            $mirror->id,
            $mirror->product_id,
            $mirror->user_id,
            $mirror->rating,
            $mirror->comment,
            $mirror->created_at,
            $mirror->user?->name,
            $productNames[$mirror->product_id] ?? null,
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function row(
        string $id,
        string $productId,
        string $userId,
        int $rating,
        ?string $comment,
        mixed $createdAt,
        ?string $reviewerName,
        ?string $productName,
    ): array {
        return [
            'id' => $id,
            'product_id' => $productId,
            'user_id' => $userId,
            'rating' => $rating,
            'comment' => $comment,
            'created_at' => $createdAt,
            'reviewer_name' => $reviewerName,
            'product_name' => $productName,
        ];
    }
}
