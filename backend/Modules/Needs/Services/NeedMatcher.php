<?php

namespace Modules\Needs\Services;

use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedProviderProfile;
use Modules\Needs\Entities\NeedRequest;

/**
 * TODO 11 transparent matching (v1, no ML).
 *
 * Eligibility runs BEFORE ranking: suspended profiles never appear, flagged
 * categories admit only vetted providers, invitation-only rows admit only
 * invitees, and the owner never matches their own request. What remains is
 * scored by documented additive signals, and every returned match carries
 * its reasons. No eligible providers → empty list, never fabrications.
 *
 * Signals (weights are constants so operations can tune them):
 *  - approved profile ............ +10 (base: platform vetted)
 *  - category match ............... +30 (or generalist with no categories)
 *  - service-area overlap ......... +10 state / +10 LGA-or-city
 *  - verified KYC identity ........ +15
 *  - completed engagements ........ +2 each, capped at +10
 *  - client review average ........ +3/6/10 for 3.5/4.0/4.5+ (approved
 *    reviews on completed requests this provider was accepted on; the
 *    schema attaches reviews to the request, not a single provider, so
 *    v1 credits every accepted provider on a reviewed request)
 *  - review volume ................ +1 each, capped at +5
 */
class NeedMatcher
{
    public const W_BASE = 10;
    public const W_CATEGORY = 30;
    public const W_AREA_STATE = 10;
    public const W_AREA_LOCAL = 10;
    public const W_KYC = 15;
    public const W_HISTORY_EACH = 2;
    public const W_HISTORY_CAP = 10;
    public const W_RATING_OK = 3;
    public const W_RATING_GOOD = 6;
    public const W_RATING_HIGH = 10;
    public const W_REVIEW_COUNT_EACH = 1;
    public const W_REVIEW_COUNT_CAP = 5;

    public const MAX_CANDIDATES = 200;

    /**
     * Rank providers for one request (owner/admin view).
     *
     * @return array{request_id: string, matches: array<int,array{user_id: string, display_name: string, score: int, reasons: string[]}>, eligible_count: int}
     */
    public function matchForRequest(NeedRequest $request, int $limit = 10): array
    {
        $matches = [];
        $inviteOnly = $request->visibility === NeedRequest::VISIBILITY_INVITE_ONLY;
        $invited = $request->invited_provider_ids ?? [];

        // N-27 availability gate: paused providers are invisible to
        // matching (and therefore to the auto-match push) until they
        // switch themselves back on.
        $candidates = NeedProviderProfile::where('status', NeedProviderProfile::STATUS_APPROVED)
            ->where('is_available', true)
            ->limit(self::MAX_CANDIDATES)
            ->get();

        // TODO 24 bulk preloads: one KYC map + one history map for all
        // candidates instead of 3 queries per row.
        $userIds = $candidates->pluck('user_id')->map(fn ($v) => (string) $v)->all();
        $kyc = $this->kycMap($userIds);
        $history = $this->historyMap($userIds);
        $ratings = $this->ratingMap($userIds);

        // Invited users without a profile row still count: the owner chose
        // them explicitly. They enter as generalists (no category claims).
        if ($inviteOnly) {
            $profiledIds = $candidates->pluck('user_id')->all();
            foreach (array_diff($invited, $profiledIds) as $userId) {
                if ((string) $userId === (string) $request->user_id) {
                    continue;
                }
                $matches[] = $this->scoreInvited($userId, $request);
            }
        }

        foreach ($candidates as $profile) {
            $userId = (string) $profile->user_id;

            if ($userId === (string) $request->user_id) {
                continue;
            }

            if ($inviteOnly && ! in_array($userId, $invited, true)) {
                continue;
            }

            if (! $inviteOnly && $this->requiresVetting($request)
                && ! ($profile->isApproved() && ($kyc[$userId] ?? false))) {
                continue;
            }

            $matches[] = $this->score($profile, $request, $inviteOnly && in_array($userId, $invited, true), $kyc[$userId] ?? false, $history[$userId] ?? 0, $ratings[$userId] ?? null);
        }

        usort($matches, fn ($a, $b) => $b['score'] <=> $a['score'] ?: strcmp($a['user_id'], $b['user_id']));

        return [
            'request_id' => (string) $request->id,
            'matches' => array_slice($matches, 0, max(1, min($limit, 50))),
            'eligible_count' => count($matches),
        ];
    }

    /**
     * Open requests one provider is actually eligible to bid on, annotated
     * with why (or why not — ineligible rows are listed with reasons instead
     * of silently vanishing, up to the limit).
     *
     * @return array{data: array, meta: array{total: int}}
     */
    public function matchForProvider(string $userId, int $limit = 20): array
    {
        $suspended = NeedProviderProfile::isSuspended($userId);

        $rows = NeedRequest::with('category:id,name,slug,requires_verified_provider')
            ->whereIn('status', NeedRequest::OPEN_STATUSES)
            ->where('user_id', '!=', $userId)
            ->orderByDesc('created_at')
            ->limit(self::MAX_CANDIDATES)
            ->get();

        $data = [];
        foreach ($rows as $request) {
            $reasons = [];
            $eligible = true;

            if ($suspended) {
                $eligible = false;
                $reasons[] = 'suspended';
            }

            $inviteOnly = $request->visibility === NeedRequest::VISIBILITY_INVITE_ONLY;
            if ($inviteOnly && ! in_array($userId, $request->invited_provider_ids ?? [], true)) {
                $eligible = false;
                $reasons[] = 'invitation_only';
            }

            if ($eligible && $this->requiresVetting($request)
                && ! NeedProviderProfile::isEligible($userId)) {
                $eligible = false;
                $reasons[] = 'requires_verified_provider';
            }

            if ($eligible && $inviteOnly) {
                $reasons[] = 'invited';
            }

            $data[] = [
                'id' => (string) $request->id,
                'request_number' => $request->request_number,
                'title' => $request->title,
                'status' => $request->status,
                'eligible' => $eligible,
                'reasons' => $reasons,
            ];

            if (count($data) >= max(1, min($limit, 50))) {
                break;
            }
        }

        return ['data' => $data, 'meta' => ['total' => count($data)]];
    }

    private function requiresVetting(NeedRequest $request): bool
    {
        return (bool) $request->category?->requires_verified_provider;
    }

    /** @return array{user_id: string, display_name: string, score: int, reasons: string[]} */
    private function scoreInvited(string $userId, NeedRequest $request): array
    {
        $name = DB::table('users')->where('id', $userId)->value('name') ?? 'Invited provider';
        $score = self::W_BASE;
        $reasons = ['invited by the request owner'];

        if (\Core\Support\KycGate::isVerified($userId)) {
            $score += self::W_KYC;
            $reasons[] = 'verified identity';
        }

        return [
            'user_id' => $userId,
            'display_name' => (string) $name,
            'score' => $score,
            'reasons' => $reasons,
        ];
    }

    /** @return array{user_id: string, display_name: string, score: int, reasons: string[]} */
    private function score(NeedProviderProfile $profile, NeedRequest $request, bool $invited, bool $kycVerified = false, int $completedCount = 0, ?array $rating = null): array
    {
        $userId = (string) $profile->user_id;
        $score = self::W_BASE;
        $reasons = ['approved provider profile'];

        $categories = $profile->category_ids ?? [];
        if ($categories === []) {
            $score += self::W_CATEGORY;
            $reasons[] = 'generalist (open to all categories)';
        } elseif ($request->category_id && in_array($request->category_id, $categories, true)) {
            $score += self::W_CATEGORY;
            $reasons[] = 'serves this category';
        }

        $areaScore = $this->areaScore($profile->service_areas ?? [], $request);
        $score += $areaScore[0];
        $reasons = array_merge($reasons, $areaScore[1]);

        if ($kycVerified) {
            $score += self::W_KYC;
            $reasons[] = 'verified identity';
        }

        if ($completedCount > 0) {
            $bonus = min($completedCount * self::W_HISTORY_EACH, self::W_HISTORY_CAP);
            $score += $bonus;
            $reasons[] = "{$completedCount} completed engagement(s)";
        }

        if ($rating !== null && $rating['total'] > 0) {
            $avg = (float) $rating['avg'];
            $ratingBonus = $avg >= 4.5 ? self::W_RATING_HIGH
                : ($avg >= 4.0 ? self::W_RATING_GOOD
                : ($avg >= 3.5 ? self::W_RATING_OK : 0));
            $volumeBonus = min((int) $rating['total'] * self::W_REVIEW_COUNT_EACH, self::W_REVIEW_COUNT_CAP);
            $score += $ratingBonus + $volumeBonus;
            $reasons[] = sprintf('%.1f average from %d client review(s)', $avg, (int) $rating['total']);
        }

        if ($invited) {
            $reasons[] = 'invited by the request owner';
        }

        return [
            'user_id' => $userId,
            'display_name' => (string) ($profile->display_name ?? $userId),
            'score' => $score,
            'reasons' => $reasons,
        ];
    }

    /** @return array{0: int, 1: string[]} */
    private function areaScore(array $areas, NeedRequest $request): array
    {
        $score = 0;
        $reasons = [];

        foreach ($areas as $area) {
            if (! is_array($area)) {
                continue;
            }
            $stateHit = ! empty($area['state']) && ! empty($request->state)
                && mb_strtolower((string) $area['state']) === mb_strtolower((string) $request->state);
            $localHit = (! empty($area['lga']) && ! empty($request->lga)
                    && mb_strtolower((string) $area['lga']) === mb_strtolower((string) $request->lga))
                || (! empty($area['city']) && ! empty($request->city)
                    && mb_strtolower((string) $area['city']) === mb_strtolower((string) $request->city));

            if ($stateHit) {
                $score += self::W_AREA_STATE;
                $reasons[] = 'serves your state';
            }
            if ($localHit) {
                $score += self::W_AREA_LOCAL;
                $reasons[] = 'serves your area';
            }
            if ($stateHit || $localHit) {
                break;
            }
        }

        return [$score, $reasons];
    }

    /** Latest KYC verdict per user (one query for all candidates). */
    private function kycMap(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $rows = DB::table('kyc_verifications')
            ->whereIn('user_id', $userIds)
            ->orderByDesc('created_at')
            ->get(['user_id', 'status']);

        $map = [];
        foreach ($rows as $row) {
            $uid = (string) $row->user_id;
            if (! array_key_exists($uid, $map)) {
                $map[$uid] = in_array($row->status, ['approved', 'verified'], true);
            }
        }

        return $map;
    }

    /** Completed engagements per user (two grouped queries for all). */
    private function historyMap(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $map = array_fill_keys($userIds, 0);

        $offers = DB::table('need_offers as o')
            ->join('need_requests as r', 'r.id', '=', 'o.need_request_id')
            ->whereIn('o.provider_id', $userIds)
            ->where('o.status', 'accepted')
            ->where('r.status', 'completed')
            ->whereNull('o.deleted_at')
            ->selectRaw('o.provider_id as user_id, count(*) as total')
            ->groupBy('o.provider_id')
            ->get();

        foreach ($offers as $row) {
            $map[(string) $row->user_id] += (int) $row->total;
        }

        $tasks = DB::table('task_applications')
            ->whereIn('user_id', $userIds)
            ->where('status', 'paid')
            ->whereNull('deleted_at')
            ->selectRaw('user_id, count(*) as total')
            ->groupBy('user_id')
            ->get();

        foreach ($tasks as $row) {
            $map[(string) $row->user_id] += (int) $row->total;
        }

        return $map;
    }

    /**
     * Approved review averages per provider: joins reviews attached to
     * completed need_requests back to the accepted offer's provider (one
     * grouped query for all candidates). The schema credits the request,
     * not a single provider, so every accepted provider on a reviewed
     * request shares the signal — documented v1 approximation.
     *
     * @return array<string, array{avg: float, total: int}>
     */
    private function ratingMap(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $rows = DB::table('reviews as r')
            ->join('need_requests as req', function ($join) {
                $join->on('req.id', '=', 'r.reviewable_id')
                    ->where('r.reviewable_type', '=', 'need_request');
            })
            ->join('need_offers as o', function ($join) {
                $join->on('o.need_request_id', '=', 'req.id')
                    ->where('o.status', '=', 'accepted');
            })
            ->whereIn('o.provider_id', $userIds)
            ->where('r.status', 'approved')
            ->where('req.status', 'completed')
            ->whereNull('r.deleted_at')
            ->whereNull('req.deleted_at')
            ->selectRaw('o.provider_id as user_id, avg(r.rating) as avg_rating, count(distinct r.id) as total')
            ->groupBy('o.provider_id')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(string) $row->user_id] = [
                'avg' => (float) $row->avg_rating,
                'total' => (int) $row->total,
            ];
        }

        return $map;
    }

    private function completedEngagements(string $userId): int
    {
        return $this->historyMap([$userId])[$userId] ?? 0;
    }
}
