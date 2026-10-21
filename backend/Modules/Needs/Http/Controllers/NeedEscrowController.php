<?php

namespace Modules\Needs\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\NotificationServiceInterface;
use Core\Services\Contracts\PaymentGatewayInterface;
use Core\Support\Currencies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedMilestone;
use Modules\Needs\Entities\NeedOffer;
use Modules\Needs\Entities\NeedRequest;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Needs\Entities\NeedTimesheet;
use Modules\Orders\Entities\Dispute;

/**
 * N-20 milestone escrow, N-21 milestone disputes and N-25 hourly
 * timesheets.
 *
 * Money rules (identical across every leg):
 *  - every movement carries a stable idempotency key, so a replayed
 *    request can never pay twice;
 *  - funding a milestone charges the owner into escrow (the platform holds
 *    it) and releasing it credits the provider - the ledger mirrors the
 *    payment rows, it never duplicates the money;
 *  - a milestone is settled exactly once (released or refunded), and the
 *    total of all milestones can never exceed the agreed price.
 */
class NeedEscrowController extends Controller
{
    public function __construct(private NotificationServiceInterface $notifications)
    {
    }

    // ── Milestones ─────────────────────────────────────────────────────────

    /**
     * GET /api/need-requests/{id}/milestones — the escrow ledger of the
     * request, for both parties and moderators.
     */
    public function milestones(Request $request, string $id): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can view the escrow ledger'], 403);
        }

        $milestones = NeedMilestone::where('need_request_id', $needRequest->id)
            ->orderBy('sequence')
            ->get();

        return response()->json(['data' => $milestones->map(fn (NeedMilestone $milestone) => $this->present($milestone))->values()]);
    }

    /**
     * POST /api/need-requests/{id}/milestones — the owner plans the
     * milestones of an accepted offer. The plan is capped by the agreed
     * price, so a milestone can never promise more than was agreed.
     */
    public function storeMilestone(Request $request, string $id): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can plan milestones'], 403);
        }

        $offer = $needRequest->acceptedOffer;
        if (! $offer) {
            return response()->json(['message' => 'Accept an offer before planning milestones'], 422);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $amount = round((float) $validated['amount'], 2);
        $agreed = $this->agreedTotal($needRequest, $offer);

        $planned = (float) NeedMilestone::where('need_request_id', $needRequest->id)->sum('amount');
        if (round($planned + $amount, 2) > round($agreed + 0.0001, 2)) {
            return response()->json([
                'message' => 'The milestone plan cannot exceed the agreed price',
                'data' => ['agreed_total' => round($agreed, 2), 'already_planned' => round($planned, 2)],
            ], 422);
        }

        $sequence = (int) (NeedMilestone::where('need_request_id', $needRequest->id)->max('sequence') ?? 0) + 1;

        $milestone = NeedMilestone::create([
            'need_request_id' => $needRequest->id,
            'offer_id' => $offer->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount' => $amount,
            'currency' => $this->currency($needRequest),
            'sequence' => $sequence,
            'status' => NeedMilestone::STATUS_PENDING,
            'created_by' => $request->user()->id,
        ]);

        $this->record($needRequest, 'milestone_planned', 'Milestone '.$sequence.' planned: '.$milestone->title);
        $this->audit('need.milestone.planned', 'need_milestone', $milestone->id, $request->user()->id, [
            'amount' => (float) $milestone->amount,
            'sequence' => $milestone->sequence,
        ]);

        return response()->json([
            'message' => 'Milestone created',
            'data' => $this->present($milestone),
        ], 201);
    }

    /**
     * PUT /api/need-requests/{id}/milestones/{milestoneId} — retitle or
     * resize a milestone while it is still unfunded.
     */
    public function updateMilestone(Request $request, string $id, string $milestoneId): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can edit milestones'], 403);
        }

        $milestone = $this->findMilestone($needRequest, $milestoneId);
        if ($milestone === null) {
            return response()->json(['message' => 'Milestone not found'], 404);
        }
        if ($milestone->status !== NeedMilestone::STATUS_PENDING) {
            return response()->json(['message' => 'Only an unfunded milestone can be edited'], 422);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
        ]);

        if (isset($validated['amount'])) {
            $agreed = $this->agreedTotal($needRequest, $needRequest->acceptedOffer);
            $other = (float) NeedMilestone::where('need_request_id', $needRequest->id)
                ->where('id', '!=', $milestone->id)
                ->sum('amount');

            if (round($other + (float) $validated['amount'], 2) > round($agreed + 0.0001, 2)) {
                return response()->json(['message' => 'The milestone plan cannot exceed the agreed price'], 422);
            }
            $milestone->amount = round((float) $validated['amount'], 2);
        }

        if (isset($validated['title'])) {
            $milestone->title = $validated['title'];
        }
        if (array_key_exists('description', $validated)) {
            $milestone->description = $validated['description'];
        }

        $milestone->save();

        return response()->json(['message' => 'Milestone updated', 'data' => $this->present($milestone)]);
    }

    /**
     * POST /api/need-requests/{id}/milestones/{milestoneId}/fund — the
     * owner funds the milestone into escrow.
     */
    public function fundMilestone(Request $request, string $id, string $milestoneId): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can fund milestones'], 403);
        }

        $milestone = $this->findMilestone($needRequest, $milestoneId);
        if ($milestone === null) {
            return response()->json(['message' => 'Milestone not found'], 404);
        }
        if ($milestone->status !== NeedMilestone::STATUS_PENDING) {
            return response()->json(['message' => 'This milestone is already funded or settled'], 422);
        }

        $offer = $needRequest->acceptedOffer;
        if (! $offer) {
            return response()->json(['message' => 'No accepted offer on this request'], 422);
        }

        $payment = DB::transaction(function () use ($request, $needRequest, $milestone) {
            $result = app(PaymentGatewayInterface::class)->charge([
                'order_id' => $needRequest->id,
                'user_id' => (string) $request->user()->id,
                'amount' => (float) $milestone->amount,
                'currency' => $milestone->currency,
                'method' => $request->input('method', 'card'),
                'reference' => 'NRESCROW-'.strtoupper(uniqid()),
                'idempotency_key' => 'NRESCROW-'.$milestone->id,
                'purpose' => 'need_milestone_fund',
                'metadata' => [
                    'need_request_id' => $needRequest->id,
                    'need_milestone_id' => $milestone->id,
                    'kind' => 'need_milestone_fund',
                ],
            ]);

            if (! ($result['success'] ?? false)) {
                throw new \RuntimeException($result['error'] ?? 'Funding failed');
            }

            $payment = \Modules\Payments\Entities\Payment::find($result['payment_id']);
            if ($payment) {
                $payment->update(['gateway_response' => array_merge(
                    (array) ($payment->gateway_response ?? []),
                    ['kind' => 'need_milestone_fund'],
                )]);
            }

            $milestone->update([
                'status' => NeedMilestone::STATUS_FUNDED,
                'payment_id' => $payment?->id,
                'funded_at' => now(),
            ]);

            return $payment;
        });

        $this->record($needRequest, 'milestone_funded', 'Milestone funded: '.$milestone->title);
        $this->audit('need.milestone.funded', 'need_milestone', $milestone->id, $request->user()->id, [
            'amount' => (float) $milestone->amount,
            'payment_id' => $payment?->id,
        ]);
        $this->notifications->notify(
            (string) $offer->provider_id,
            'Milestone funded',
            "Milestone '{$milestone->title}' is funded in escrow and ready to start.",
            'need_milestone_funded',
            $milestone->id
        );

        return response()->json(['message' => 'Milestone funded into escrow', 'data' => $this->present($milestone->fresh())]);
    }

    /**
     * POST /api/need-requests/{id}/milestones/{milestoneId}/release — the
     * owner releases the escrowed milestone to the provider.
     */
    public function releaseMilestone(Request $request, string $id, string $milestoneId): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can release a milestone'], 403);
        }

        $milestone = $this->findMilestone($needRequest, $milestoneId);
        if ($milestone === null) {
            return response()->json(['message' => 'Milestone not found'], 404);
        }
        if ($milestone->status !== NeedMilestone::STATUS_FUNDED) {
            return response()->json(['message' => 'Only a funded milestone can be released'], 422);
        }

        $offer = $needRequest->acceptedOffer;
        if (! $offer) {
            return response()->json(['message' => 'No accepted offer on this request'], 422);
        }

        $payment = DB::transaction(function () use ($needRequest, $milestone, $offer) {
            $result = app(PaymentGatewayInterface::class)->charge([
                'order_id' => $needRequest->id,
                'user_id' => (string) $offer->provider_id,
                'amount' => (float) $milestone->amount,
                'currency' => $milestone->currency,
                'method' => 'platform_escrow',
                'reference' => 'NEEDPAYOUT-'.strtoupper(uniqid()),
                'idempotency_key' => 'NEEDPAYOUT-'.$milestone->id,
                'purpose' => 'need_milestone_release',
                'metadata' => [
                    'need_request_id' => $needRequest->id,
                    'need_milestone_id' => $milestone->id,
                    'kind' => 'need_milestone_release',
                ],
            ]);

            if (! ($result['success'] ?? false)) {
                throw new \RuntimeException($result['error'] ?? 'Release failed');
            }

            $payout = \Modules\Payments\Entities\Payment::find($result['payment_id']);
            if ($payout) {
                $payout->update(['gateway_response' => array_merge(
                    (array) ($payout->gateway_response ?? []),
                    ['kind' => 'need_milestone_release'],
                )]);
            }

            $milestone->update([
                'status' => NeedMilestone::STATUS_RELEASED,
                'payout_payment_id' => $payout?->id,
                'released_at' => now(),
            ]);

            return $payout;
        });

        $this->record($needRequest, 'milestone_released', 'Milestone released: '.$milestone->title);
        $this->audit('need.milestone.released', 'need_milestone', $milestone->id, (string) $offer->provider_id, [
            'amount' => (float) $milestone->amount,
            'payment_id' => $payment?->id,
        ]);
        $this->notifications->notify(
            (string) $offer->provider_id,
            'Milestone paid',
            "Milestone '{$milestone->title}' was released to you.",
            'need_milestone_released',
            $milestone->id
        );

        return response()->json(['message' => 'Milestone released to the provider', 'data' => $this->present($milestone->fresh())]);
    }

    /**
     * POST /api/need-requests/{id}/milestones/{milestoneId}/refund — the
     * owner (or a moderator) returns a funded milestone to the payer.
     */
    public function refundMilestone(Request $request, string $id, string $milestoneId): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest) && ! $this->isModerator($request)) {
            return response()->json(['message' => 'Only the request owner or a moderator can refund a milestone'], 403);
        }

        $milestone = $this->findMilestone($needRequest, $milestoneId);
        if ($milestone === null) {
            return response()->json(['message' => 'Milestone not found'], 404);
        }
        if ($milestone->status !== NeedMilestone::STATUS_FUNDED) {
            return response()->json(['message' => 'Only a funded milestone can be refunded'], 422);
        }
        if (! $milestone->payment_id) {
            return response()->json(['message' => 'This milestone has no escrow payment to refund'], 422);
        }

        $refund = DB::transaction(function () use ($request, $needRequest, $milestone) {
            $result = app(PaymentGatewayInterface::class)->refund([
                'payment_id' => $milestone->payment_id,
                'amount' => (float) $milestone->amount,
                'reason' => 'need_milestone_refund',
                'idempotency_key' => 'NRREFUND-'.$milestone->id,
            ]);

            if (! ($result['success'] ?? false)) {
                throw new \RuntimeException($result['error'] ?? 'Refund failed');
            }

            $milestone->update([
                'status' => NeedMilestone::STATUS_REFUNDED,
                'refunded_at' => now(),
            ]);

            return $result;
        });

        $this->record($needRequest, 'milestone_refunded', 'Milestone refunded: '.$milestone->title);
        $this->audit('need.milestone.refunded', 'need_milestone', $milestone->id, $request->user()->id, [
            'amount' => (float) $milestone->amount,
            'refund_id' => $refund['refund_id'] ?? null,
        ]);

        return response()->json(['message' => 'Milestone refunded', 'data' => $this->present($milestone->fresh())]);
    }

    /**
     * POST /api/need-requests/{id}/milestones/{milestoneId}/dispute — either
     * party escalates a funded milestone into an arbitrated dispute.
     */
    public function openMilestoneDispute(Request $request, string $id, string $milestoneId): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can dispute a milestone'], 403);
        }

        $milestone = $this->findMilestone($needRequest, $milestoneId);
        if ($milestone === null) {
            return response()->json(['message' => 'Milestone not found'], 404);
        }
        if (! in_array($milestone->status, [NeedMilestone::STATUS_FUNDED, NeedMilestone::STATUS_RELEASED], true)) {
            return response()->json(['message' => 'Only a funded milestone can be disputed'], 422);
        }

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:4000'],
        ]);

        $existing = Dispute::where('need_request_id', $needRequest->id)
            ->where('need_milestone_id', $milestone->id)
            ->whereIn('status', ['open', 'in_review'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This milestone already has an open dispute',
                'data' => ['dispute_id' => $existing->id],
            ], 409);
        }

        $dispute = DB::transaction(function () use ($request, $needRequest, $milestone, $validated) {
            $dispute = Dispute::create([
                'user_id' => $request->user()->id,
                'need_request_id' => $needRequest->id,
                'need_milestone_id' => $milestone->id,
                'subject' => $validated['subject'],
                'description' => $validated['description'],
                'status' => 'open',
                'resolution' => 'none',
                'arbitration_status' => 'pending',
            ]);

            $milestone->update(['status' => NeedMilestone::STATUS_DISPUTED]);

            return $dispute;
        });

        $this->record($needRequest, 'milestone_disputed', 'Milestone disputed: '.$milestone->title);
        $this->audit('need.milestone.disputed', 'dispute', $dispute->id, $request->user()->id, [
            'need_milestone_id' => $milestone->id,
        ]);

        $other = (string) $needRequest->user_id === (string) $request->user()->id
            ? (string) ($needRequest->acceptedOffer?->provider_id)
            : (string) $needRequest->user_id;

        if ($other !== '') {
            $this->notifications->notify(
                $other,
                'Milestone disputed',
                "A dispute was opened for milestone '{$milestone->title}'.",
                'need_disputed',
                $dispute->id
            );
        }

        return response()->json(['message' => 'Dispute opened', 'data' => ['id' => $dispute->id]], 201);
    }

    // ── Timesheets ─────────────────────────────────────────────────────────

    /**
     * GET /api/need-requests/{id}/timesheets — the hourly ledger.
     */
    public function timesheets(Request $request, string $id): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isParty($request, $needRequest)) {
            return response()->json(['message' => 'Only the request parties can view the timesheets'], 403);
        }

        $entries = NeedTimesheet::where('need_request_id', $needRequest->id)
            ->orderBy('work_date')
            ->get();

        return response()->json([
            'data' => $entries->map(fn (NeedTimesheet $entry) => $this->presentTimesheet($entry))->values(),
            'summary' => [
                'submitted_minutes' => (int) $entries->where('status', NeedTimesheet::STATUS_SUBMITTED)->sum('minutes'),
                'approved_minutes' => (int) $entries->whereIn('status', [NeedTimesheet::STATUS_APPROVED, NeedTimesheet::STATUS_PAID])->sum('minutes'),
                'approved_amount' => round((float) $entries->whereIn('status', [NeedTimesheet::STATUS_APPROVED, NeedTimesheet::STATUS_PAID])->sum('amount'), 2),
            ],
        ]);
    }

    /**
     * POST /api/need-requests/{id}/timesheets — the accepted provider
     * logs the hours worked on a day.
     */
    public function storeTimesheet(Request $request, string $id): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        $offer = $needRequest->acceptedOffer;
        if (! $offer || (string) $offer->provider_id !== (string) $request->user()->id) {
            return response()->json(['message' => 'Only the accepted provider can log time'], 403);
        }

        $validated = $request->validate([
            'work_date' => ['required', 'date'],
            'minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'note' => ['nullable', 'string', 'max:2000'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        $rate = isset($validated['hourly_rate'])
            ? round((float) $validated['hourly_rate'], 2)
            : $this->hourlyRate($needRequest, $offer);

        if ($rate <= 0) {
            return response()->json(['message' => 'No hourly rate is agreed on this request'], 422);
        }

        $workDate = substr((string) $validated['work_date'], 0, 10);

        $entry = NeedTimesheet::firstOrCreate(
            [
                'need_request_id' => $needRequest->id,
                'provider_id' => $request->user()->id,
                'work_date' => $workDate,
            ],
            [
                'minutes' => (int) $validated['minutes'],
                'hourly_rate' => $rate,
                'amount' => round(((int) $validated['minutes'] / 60) * $rate, 2),
                'currency' => $this->currency($needRequest),
                'note' => $validated['note'] ?? null,
                'status' => NeedTimesheet::STATUS_SUBMITTED,
            ]
        );

        if ($entry->wasRecentlyCreated) {
            $this->record($needRequest, 'timesheet_submitted', 'Timesheet logged for '.$workDate);
            $this->notifications->notify(
                (string) $needRequest->user_id,
                'Timesheet submitted',
                "The provider logged ".$entry->minutes." minutes on {$workDate}.",
                'need_timesheet_submitted',
                $entry->id
            );
        }

        return response()->json([
            'message' => $entry->wasRecentlyCreated ? 'Timesheet submitted' : 'Timesheet already logged for that day',
            'data' => $this->presentTimesheet($entry),
        ], $entry->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * POST /api/need-requests/{id}/timesheets/{entryId}/approve — the
     * owner approves the logged hours.
     */
    public function approveTimesheet(Request $request, string $id, string $entryId): JsonResponse
    {
        [$needRequest, $entry] = $this->findTimesheet($request, $id, $entryId);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can approve hours'], 403);
        }
        if ($entry === null) {
            return response()->json(['message' => 'Timesheet not found'], 404);
        }
        if ($entry->status !== NeedTimesheet::STATUS_SUBMITTED) {
            return response()->json(['message' => 'Only a submitted timesheet can be approved'], 422);
        }

        $entry->update([
            'status' => NeedTimesheet::STATUS_APPROVED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $this->record($needRequest, 'timesheet_approved', 'Timesheet approved: '.$entry->minutes.' minutes');
        $this->audit('need.timesheet.approved', 'need_timesheet', $entry->id, $request->user()->id, [
            'minutes' => $entry->minutes,
            'amount' => (float) $entry->amount,
        ]);
        $this->notifications->notify(
            (string) $entry->provider_id,
            'Timesheet approved',
            "Your timesheet for {$entry->work_date->toDateString()} was approved.",
            'need_timesheet_approved',
            $entry->id
        );

        return response()->json(['message' => 'Timesheet approved', 'data' => $this->presentTimesheet($entry->fresh())]);
    }

    /**
     * POST /api/need-requests/{id}/timesheets/{entryId}/reject — the owner
     * rejects the logged hours with a reason.
     */
    public function rejectTimesheet(Request $request, string $id, string $entryId): JsonResponse
    {
        [$needRequest, $entry] = $this->findTimesheet($request, $id, $entryId);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can reject hours'], 403);
        }
        if ($entry === null) {
            return response()->json(['message' => 'Timesheet not found'], 404);
        }
        if ($entry->status !== NeedTimesheet::STATUS_SUBMITTED) {
            return response()->json(['message' => 'Only a submitted timesheet can be rejected'], 422);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $entry->update([
            'status' => NeedTimesheet::STATUS_REJECTED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'note' => $validated['note'] ?? $entry->note,
        ]);

        $this->record($needRequest, 'timesheet_rejected', 'Timesheet rejected');
        $this->notifications->notify(
            (string) $entry->provider_id,
            'Timesheet rejected',
            "Your timesheet for {$entry->work_date->toDateString()} was rejected.",
            'need_timesheet_rejected',
            $entry->id
        );

        return response()->json(['message' => 'Timesheet rejected', 'data' => $this->presentTimesheet($entry->fresh())]);
    }

    /**
     * POST /api/need-requests/{id}/timesheets/pay — the owner pays every
     * approved-but-unpaid timesheet. Each entry is paid with its own
     * idempotency key, so a replay cannot pay twice.
     */
    public function payTimesheets(Request $request, string $id): JsonResponse
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return response()->json(['message' => 'Request not found'], 404);
        }
        if (! $this->isOwner($request, $needRequest)) {
            return response()->json(['message' => 'Only the request owner can pay hours'], 403);
        }

        $offer = $needRequest->acceptedOffer;
        if (! $offer) {
            return response()->json(['message' => 'No accepted offer on this request'], 422);
        }

        $entries = NeedTimesheet::where('need_request_id', $needRequest->id)
            ->where('status', NeedTimesheet::STATUS_APPROVED)
            ->orderBy('work_date')
            ->get();

        if ($entries->isEmpty()) {
            return response()->json(['message' => 'No approved hours to pay'], 422);
        }

        $paid = [];
        $failed = [];

        foreach ($entries as $entry) {
            try {
                $payment = DB::transaction(function () use ($needRequest, $entry, $offer) {
                    $result = app(PaymentGatewayInterface::class)->charge([
                        'order_id' => $needRequest->id,
                        'user_id' => (string) $offer->provider_id,
                        'amount' => (float) $entry->amount,
                        'currency' => $entry->currency,
                        'method' => 'platform_escrow',
                        'reference' => 'NEEDPAYOUT-'.strtoupper(uniqid()),
                        'idempotency_key' => 'NEEDPAYOUT-TS-'.$entry->id,
                        'purpose' => 'need_timesheet_payout',
                        'metadata' => [
                            'need_request_id' => $needRequest->id,
                            'need_timesheet_id' => $entry->id,
                            'kind' => 'need_timesheet_payout',
                        ],
                    ]);

                    if (! ($result['success'] ?? false)) {
                        throw new \RuntimeException($result['error'] ?? 'Payout failed');
                    }

                    $payment = \Modules\Payments\Entities\Payment::find($result['payment_id']);
                    if ($payment) {
                        $payment->update(['gateway_response' => array_merge(
                            (array) ($payment->gateway_response ?? []),
                            ['kind' => 'need_timesheet_payout'],
                        )]);
                    }

                    $entry->update([
                        'status' => NeedTimesheet::STATUS_PAID,
                        'payment_id' => $payment?->id,
                    ]);

                    return $payment;
                });

                $paid[] = ['id' => $entry->id, 'amount' => (float) $entry->amount, 'payment_id' => $payment?->id];
            } catch (\Throwable $e) {
                $failed[] = ['id' => $entry->id, 'error' => $e->getMessage()];
            }
        }

        $this->record($needRequest, 'timesheets_paid', count($paid).' timesheet(s) paid');
        $this->audit('need.timesheet.paid', 'need_request', $needRequest->id, $request->user()->id, [
            'paid' => count($paid),
            'failed' => count($failed),
        ]);

        if ($paid !== []) {
            $this->notifications->notify(
                (string) $offer->provider_id,
                'Hours paid',
                count($paid).' approved timesheet(s) were paid out.',
                'need_timesheet_paid',
                $needRequest->id
            );
        }

        return response()->json([
            'message' => $failed === [] ? 'Approved hours paid' : 'Some timesheets could not be paid',
            'data' => ['paid' => $paid, 'failed' => $failed],
        ], $failed === [] ? 200 : 207);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private function findRequest(string $id): ?NeedRequest
    {
        return NeedRequest::find($id);
    }

    private function findMilestone(NeedRequest $needRequest, string $milestoneId): ?NeedMilestone
    {
        return NeedMilestone::where('need_request_id', $needRequest->id)->find($milestoneId);
    }

    /**
     * @return array{0: ?NeedRequest, 1: ?NeedTimesheet}
     */
    private function findTimesheet(Request $request, string $id, string $entryId): array
    {
        $needRequest = $this->findRequest($id);
        if ($needRequest === null) {
            return [null, null];
        }

        $entry = NeedTimesheet::where('need_request_id', $needRequest->id)->find($entryId);

        return [$needRequest, $entry];
    }

    private function agreedTotal(NeedRequest $needRequest, ?NeedOffer $offer): float
    {
        if ($needRequest->agreed_price_override !== null) {
            return round((float) $needRequest->agreed_price_override, 2);
        }
        if ($offer) {
            return round((float) $offer->price, 2);
        }

        return round((float) ($needRequest->budget_max ?? 0), 2);
    }

    private function currency(NeedRequest $needRequest): string
    {
        $currency = Currencies::normalize($needRequest->currency);

        return Currencies::isSupported($currency) ? $currency : Currencies::default();
    }

    /**
     * The hourly rate of an hourly-priced request: the agreed offer price
     * is the rate per hour, falling back to the request budget ceiling.
     */
    private function hourlyRate(NeedRequest $needRequest, NeedOffer $offer): float
    {
        if ($needRequest->pricing_basis === NeedRequest::PRICING_HOURLY) {
            return round((float) $offer->price, 2);
        }

        return round((float) ($needRequest->budget_max ?? 0), 2);
    }

    private function isOwner(Request $request, NeedRequest $needRequest): bool
    {
        return (string) $needRequest->user_id === (string) $request->user()->id;
    }

    private function isParty(Request $request, NeedRequest $needRequest): bool
    {
        if ($this->isModerator($request)) {
            return true;
        }
        if ($this->isOwner($request, $needRequest)) {
            return true;
        }

        $accepted = $needRequest->acceptedOffer;

        return $accepted !== null && (string) $accepted->provider_id === (string) $request->user()->id;
    }

    private function isModerator(Request $request): bool
    {
        $user = $request->user();

        return $user->hasRole('super_admin')
            || $user->hasRole('administrator')
            || $user->hasRole('needs_admin')
            || $user->hasRole('platform_ops');
    }

    private function record(NeedRequest $needRequest, string $action, string $note): void
    {
        try {
            NeedRequestEvent::create([
                'need_request_id' => $needRequest->id,
                'actor_id' => auth('sanctum')->id() ?? auth()->id(),
                'from_status' => $needRequest->status,
                'to_status' => $needRequest->status,
                'action' => $action,
                'note' => $note,
            ]);
        } catch (\Throwable) {
            // The timeline must never break a money path.
        }
    }

    private function audit(string $action, string $entityType, ?string $entityId, ?string $actorId, array $values): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'performed_by' => $actorId,
                'new_values' => $values,
            ]);
        } catch (\Throwable) {
            // Audit must never break the money path.
        }
    }

    private function present(NeedMilestone $milestone): array
    {
        return [
            'id' => $milestone->id,
            'need_request_id' => $milestone->need_request_id,
            'title' => $milestone->title,
            'description' => $milestone->description,
            'amount' => (float) $milestone->amount,
            'currency' => $milestone->currency,
            'sequence' => $milestone->sequence,
            'status' => $milestone->status,
            'payment_id' => $milestone->payment_id,
            'payout_payment_id' => $milestone->payout_payment_id,
            'funded_at' => $milestone->funded_at,
            'released_at' => $milestone->released_at,
            'refunded_at' => $milestone->refunded_at,
        ];
    }

    private function presentTimesheet(NeedTimesheet $entry): array
    {
        return [
            'id' => $entry->id,
            'need_request_id' => $entry->need_request_id,
            'provider_id' => $entry->provider_id,
            'work_date' => $entry->work_date?->toDateString(),
            'minutes' => $entry->minutes,
            'hours' => round($entry->minutes / 60, 2),
            'hourly_rate' => (float) $entry->hourly_rate,
            'amount' => (float) $entry->amount,
            'currency' => $entry->currency,
            'note' => $entry->note,
            'status' => $entry->status,
            'approved_at' => $entry->approved_at,
            'payment_id' => $entry->payment_id,
        ];
    }
}
