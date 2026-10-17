<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Needs\Entities\NeedProviderProfile;

/**
 * TODO 08 provider onboarding (provider-facing side).
 *
 * Profiles are platform-approval records: identity is proven by KYC
 * (KycGate), qualifications/evidence ride along for reviewers. Status flow:
 * draft → submitted → trial → approved/rejected → (resubmit) → suspended
 * ⇄ submitted. Editing a reviewed profile returns it to screening — the
 * stage (and trial clock) must always describe the live content.
 */
class ProviderProfileController extends Controller
{
    /**
     * GET /api/provider-profile — the caller's own profile, if any.
     */
    public function show(Request $request): JsonResponse
    {
        $profile = NeedProviderProfile::where('user_id', $request->user()->id)->first();

        if (! $profile) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => $this->present($profile, true)]);
    }

    /**
     * POST /api/provider-profile — create or revise the caller's profile.
     * submit=false saves a draft; submit=true sends it for review.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'min:3', 'max:120'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'category_ids' => ['nullable', 'array', 'max:20'],
            'category_ids.*' => ['uuid', 'exists:need_categories,id'],
            'service_areas' => ['nullable', 'array', 'max:20'],
            'service_areas.*.state' => ['required_with:service_areas', 'string', 'max:120'],
            'service_areas.*.lga' => ['nullable', 'string', 'max:120'],
            'service_areas.*.city' => ['nullable', 'string', 'max:120'],
            'qualifications' => ['nullable', 'array', 'max:20'],
            'qualifications.*' => ['string', 'max:200'],
            'evidence_urls' => ['nullable', 'array', 'max:10'],
            'evidence_urls.*' => ['url', 'max:500'],
            'submit' => ['nullable', 'boolean'],
        ]);

        $submit = (bool) ($validated['submit'] ?? false);
        unset($validated['submit']);

        if ($submit && empty($validated['category_ids'])) {
            return response()->json(['message' => 'Choose at least one service category before submitting'], 422);
        }

        $profile = NeedProviderProfile::where('user_id', $request->user()->id)->first();

        if ($profile && $profile->status === NeedProviderProfile::STATUS_SUSPENDED) {
            return response()->json(['message' => 'Suspended profiles cannot be edited; contact support'], 403);
        }

        $status = $submit
            ? NeedProviderProfile::STATUS_SUBMITTED
            : NeedProviderProfile::STATUS_DRAFT;

        if ($profile) {
            $wasApproved = $profile->isApproved();
            $profile->update(array_merge($validated, [
                'status' => $status,
                // Re-review: approval (or trial) describes live content,
                // never stale text — the trial clock restarts too.
                'reviewed_by' => $status === NeedProviderProfile::STATUS_SUBMITTED && $wasApproved ? null : $profile->reviewed_by,
                'reviewed_at' => $status === NeedProviderProfile::STATUS_SUBMITTED && $wasApproved ? null : $profile->reviewed_at,
                'trial_started_at' => null,
            ]));
        } else {
            $profile = NeedProviderProfile::create(array_merge($validated, [
                'user_id' => $request->user()->id,
                'status' => $status,
            ]));
        }

        return response()->json([
            'message' => $submit ? 'Profile submitted for review' : 'Profile draft saved',
            'data' => $this->present($profile->fresh(), true),
        ], $profile->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * POST /api/provider-profile/availability — N-27 pause switch.
     *
     * Deliberately separate from store(): flipping availability must
     * never touch vetting state (no re-review, no trial clock reset).
     */
    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $profile = NeedProviderProfile::where('user_id', $request->user()->id)->first();
        if (! $profile) {
            return response()->json(['message' => 'No provider profile yet'], 404);
        }

        $profile->update(['is_available' => (bool) $validated['is_available']]);

        return response()->json([
            'message' => $profile->isAvailable()
                ? 'You are visible to matching requests again'
                : 'You are hidden from new matches',
            'data' => $this->present($profile->fresh(), true),
        ]);
    }

    /**
     * Owner sees everything; reviewers (admin show) get the same shape —
     * evidence URLs are reviewer-and-owner-only by route gating, never
     * exposed on public provider surfaces.
     */
    public static function present(NeedProviderProfile $profile, bool $includeEvidence): array
    {
        $data = $profile->toArray();
        if (! $includeEvidence) {
            unset($data['evidence_urls']);
        }
        $data['kyc_state'] = \Core\Support\KycGate::verificationState((string) $profile->user_id);

        return $data;
    }
}
