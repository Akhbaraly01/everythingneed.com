<?php

namespace Modules\Needs\Services;

use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\FraudFlag;

/**
 * P0 fraud rules (flags for HUMAN review — never auto-punish):
 *  - duplicate_text: same user filed 3+ requests with identical description
 *    in 24h (spam/copy-paste flooding).
 *  - high_value_new_account: account younger than 7 days posts a request
 *    with budget_max above 5000 (mule/scam pattern).
 *  - price_outlier_offer: an offer priced above 3x the median of its
 *    sibling offers on the same request (bait or typo, needs a look).
 *
 * Thresholds are constants so operations can tune them without schema
 * changes. Re-scans refresh open flags, never duplicate them (unique
 * rule+entity+status).
 */
class NeedsFraudScanner
{
    public const DUPLICATE_TEXT_MIN = 3;
    public const NEW_ACCOUNT_DAYS = 7;
    public const HIGH_VALUE_BUDGET = 5000;
    public const OUTLIER_MULTIPLIER = 3;

    /**
     * @return array{scanned: int, flagged: int}
     */
    public function scan(): array
    {
        $flagged = 0;
        $flagged += $this->duplicateText();
        $flagged += $this->highValueNewAccounts();
        $flagged += $this->priceOutliers();

        return ['scanned' => 3, 'flagged' => $flagged];
    }

    private function flag(string $rule, string $entityType, string $entityId, ?string $userId, array $details): bool
    {
        $exists = FraudFlag::where('rule', $rule)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('status', FraudFlag::STATUS_OPEN)
            ->exists();

        if ($exists) {
            return false;
        }

        FraudFlag::create([
            'rule' => $rule,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'user_id' => $userId,
            'details' => $details,
            'status' => FraudFlag::STATUS_OPEN,
        ]);

        return true;
    }

    private function duplicateText(): int
    {
        $rows = DB::table('need_requests')
            ->selectRaw('user_id, description, count(*) as total')
            ->where('created_at', '>=', now()->subDay())
            ->whereNull('deleted_at')
            ->groupBy('user_id', 'description')
            ->havingRaw('count(*) >= ?', [self::DUPLICATE_TEXT_MIN])
            ->get();

        $count = 0;
        foreach ($rows as $row) {
            $sample = DB::table('need_requests')
                ->where('user_id', $row->user_id)
                ->where('description', $row->description)
                ->orderByDesc('created_at')
                ->first(['id']);
            if ($sample && $this->flag('duplicate_text', 'need_request', (string) $sample->id, (string) $row->user_id, [
                'copies_24h' => (int) $row->total,
            ])) {
                $count++;
            }
        }

        return $count;
    }

    private function highValueNewAccounts(): int
    {
        $cutoff = now()->subDays(self::NEW_ACCOUNT_DAYS);

        $rows = DB::table('need_requests as nr')
            ->join('users as u', 'u.id', '=', 'nr.user_id')
            ->where('nr.created_at', '>=', now()->subDay())
            ->where('u.created_at', '>=', $cutoff)
            ->where('nr.budget_max', '>', self::HIGH_VALUE_BUDGET)
            ->whereNull('nr.deleted_at')
            ->select(['nr.id', 'nr.user_id', 'nr.budget_max'])
            ->get();

        $count = 0;
        foreach ($rows as $row) {
            if ($this->flag('high_value_new_account', 'need_request', (string) $row->id, (string) $row->user_id, [
                'budget_max' => (float) $row->budget_max,
            ])) {
                $count++;
            }
        }

        return $count;
    }

    private function priceOutliers(): int
    {
        $count = 0;

        $requestIds = DB::table('need_offers')
            ->where('created_at', '>=', now()->subDay())
            ->distinct()
            ->pluck('need_request_id');

        foreach ($requestIds as $requestId) {
            $prices = DB::table('need_offers')
                ->where('need_request_id', $requestId)
                ->whereNotIn('status', ['rejected', 'withdrawn'])
                ->orderBy('price')
                ->pluck('price', 'id');

            if ($prices->count() < 3) {
                continue;
            }

            $sorted = $prices->values()->map(fn ($p) => (float) $p)->sort()->values();
            $mid = intdiv($sorted->count(), 2);
            $median = $sorted->count() % 2 === 1
                ? $sorted[$mid]
                : ($sorted[$mid - 1] + $sorted[$mid]) / 2;

            if ($median <= 0) {
                continue;
            }

            foreach ($prices as $offerId => $price) {
                if ((float) $price > $median * self::OUTLIER_MULTIPLIER) {
                    $offer = DB::table('need_offers')->where('id', $offerId)->first(['provider_id']);
                    if ($offer && $this->flag('price_outlier_offer', 'need_offer', (string) $offerId, $offer->provider_id ? (string) $offer->provider_id : null, [
                        'price' => (float) $price,
                        'sibling_median' => $median,
                    ])) {
                        $count++;
                    }
                }
            }
        }

        return $count;
    }
}
