<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\AuditServiceInterface;
use Core\Services\Contracts\NotificationServiceInterface;
use Core\Services\Contracts\PaymentGatewayInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedMilestone;
use Modules\Needs\Entities\NeedRequestEvent;
use Modules\Orders\Entities\Dispute;

/**
 * N-21 arbitration of an escrowed need milestone.
 *
 * A moderator splits the held amount: the provider award is credited to
 * the provider and the remainder is refunded to the payer. Both legs are
 * idempotent (the award uses a stable key, the refund a stable refund id),
 * so re-running an arbitration can never move money twice.
 */
class AdminNeedsArbitrationController extends Controller
{
    public function __construct(private NotificationServiceInterface $notifications)
    {
    }

    /**
     * POST /api/admin/needs/disputes/{id}/arbitrate
     *
     * Body: provider_amount | provider_percent, plus notes.
     */
    public function arbitrate(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'provider_amount' => ['nullable', 'numeric', 'min:0'],
            'provider_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['required', 'string', 'max:2000'],
        ]);

        $dispute = Dispute::where('need_request_id', '!=', null)->find($id);
        if (! $dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }
        if (! $dispute->need_milestone_id) {
            return response()->json(['message' => 'This dispute is not tied to an escrowed milestone'], 422);
        }
        if (in_array($dispute->status, ['resolved', 'closed'], true)) {
            return response()->json(['message' => 'This dispute is already resolved'], 422);
        }

        $milestone = NeedMilestone::find($dispute->need_milestone_id);
        if (! $milestone) {
            return response()->json(['message' => 'The milestone of this dispute no longer exists'], 422);
        }
        if (! in_array($milestone->status, [NeedMilestone::STATUS_FUNDED, NeedMilestone::STATUS_DISPUTED, NeedMilestone::STATUS_RELEASED], true)) {
            return response()->json(['message' => 'Only a funded or released milestone can be arbitrated'], 422);
        }

        $held = round((float) $milestone->amount, 2);

        $award = $this->resolveAward($validated, $held);
        $refund = round($held - $award, 2);

        try {
            $moved = DB::transaction(function () use ($request, $dispute, $milestone, $award, $refund, $validated) {
                $providerPaid = 0.0;
                $buyerRefunded = 0.0;

                // The payment that holds the money is resolved BEFORE any
                // leg moves: the buyer is always refunded against the
                // escrow funding (or, for an already released milestone,
                // against the release payout).
                $refundSource = $milestone->status === NeedMilestone::STATUS_RELEASED
                    ? ($milestone->payout_payment_id ?? $milestone->payment_id)
                    : $milestone->payment_id;

                // The provider leg: credited only when the milestone is
                // still held (funded, or disputed but not yet released).
                // A released milestone was already paid out, so the
                // provider keeps it and only the buyer is refunded.
                if ($award > 0 && in_array($milestone->status, [NeedMilestone::STATUS_FUNDED, NeedMilestone::STATUS_DISPUTED], true)) {
                    $result = app(PaymentGatewayInterface::class)->charge([
                        'order_id' => (string) $milestone->need_request_id,
                        'user_id' => (string) ($milestone->offer?->provider_id ?? $this->providerOf($milestone)),
                        'amount' => $award,
                        'currency' => $milestone->currency,
                        'method' => 'platform_escrow',
                        'reference' => 'NEEDPAYOUT-'.strtoupper(uniqid()),
                        'idempotency_key' => 'NEEDPAYOUT-ARB-'.$milestone->id,
                        'purpose' => 'need_arbitration_award',
                        'metadata' => [
                            'need_request_id' => $milestone->need_request_id,
                            'need_milestone_id' => $milestone->id,
                            'dispute_id' => $dispute->id,
                            'kind' => 'need_arbitration_award',
                        ],
                    ]);

                    if (! ($result['success'] ?? false)) {
                        throw new \RuntimeException($result['error'] ?? 'The provider award failed');
                    }

                    $payment = \Modules\Payments\Entities\Payment::find($result['payment_id']);
                    if ($payment) {
                        $payment->update(['gateway_response' => array_merge(
                            (array) ($payment->gateway_response ?? []),
                            ['kind' => 'need_arbitration_award'],
                        )]);
                    }

                    $providerPaid = $award;
                    $milestone->update([
                        'status' => NeedMilestone::STATUS_RELEASED,
                        'payout_payment_id' => $payment?->id,
                        'released_at' => now(),
                    ]);
                }

                // The buyer leg: refunded against the payment that holds
                // the money (the escrow funding, or the release payout
                // when the milestone was already paid out).
                if ($refund > 0) {
                    $source = $refundSource;

                    if (! $source) {
                        throw new \RuntimeException('There is no payment to refund');
                    }

                    $result = app(PaymentGatewayInterface::class)->refund([
                        'payment_id' => $source,
                        'amount' => $refund,
                        'reason' => 'need_arbitration_award',
                        'idempotency_key' => 'NRREFUND-ARB-'.$milestone->id,
                    ]);

                    if (! ($result['success'] ?? false)) {
                        throw new \RuntimeException($result['error'] ?? 'The buyer refund failed');
                    }

                    $buyerRefunded = $refund;

                    if ($award <= 0) {
                        $milestone->update([
                            'status' => NeedMilestone::STATUS_REFUNDED,
                            'refunded_at' => now(),
                        ]);
                    }
                }

                $dispute->update([
                    'status' => 'resolved',
                    'resolution' => $refund > 0 ? 'credit' : 'refund',
                    'resolution_notes' => $validated['notes'],
                    'arbitration_status' => $award > 0 && $refund > 0
                        ? Dispute::ARBITRATION_SPLIT
                        : ($award > 0 ? Dispute::ARBITRATION_AWARDED : Dispute::ARBITRATION_REFUNDED),
                    'provider_award' => $providerPaid,
                    'buyer_refund' => $buyerRefunded,
                    'arbitrated_by' => $request->user()->id,
                    'arbitrated_at' => now(),
                    'arbitration_notes' => $validated['notes'],
                ]);

                return ['provider_paid' => $providerPaid, 'buyer_refunded' => $buyerRefunded];
            });
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->recordEvent($milestone, $request, 'dispute_arbitrated', 'Arbitrated: '.$validated['notes']);

        try {
            app(AuditServiceInterface::class)->log([
                'action' => 'dispute.arbitrated',
                'entity_type' => 'dispute',
                'entity_id' => $dispute->id,
                'performed_by' => $request->user()->id,
                'new_values' => [
                    'provider_award' => $moved['provider_paid'],
                    'buyer_refund' => $moved['buyer_refunded'],
                    'need_milestone_id' => $milestone->id,
                ],
            ]);
        } catch (\Throwable) {
            // Audit must never break the money path.
        }

        $providerId = (string) ($milestone->offer?->provider_id ?? $this->providerOf($milestone));
        if ($providerId !== '' && $moved['provider_paid'] > 0) {
            $this->notifications->notify(
                $providerId,
                'Arbitration awarded',
                'You were awarded '.number_format((float) $moved['provider_paid'], 2).' for the disputed milestone.',
                'need_arbitration_awarded',
                $dispute->id
            );
        }

        return response()->json([
            'message' => 'Dispute arbitrated',
            'data' => [
                'dispute_id' => $dispute->id,
                'need_milestone_id' => $milestone->id,
                'provider_award' => $moved['provider_paid'],
                'buyer_refund' => $moved['buyer_refunded'],
                'currency' => $milestone->currency,
                'arbitration_status' => $dispute->fresh()->arbitration_status,
            ],
        ]);
    }

    /**
     * The award is either an absolute amount or a percentage of the held
     * amount; an award may never exceed what is held.
     */
    private function resolveAward(array $validated, float $held): float
    {
        if (isset($validated['provider_amount'])) {
            $award = round((float) $validated['provider_amount'], 2);
        } elseif (isset($validated['provider_percent'])) {
            $award = round($held * ((float) $validated['provider_percent'] / 100), 2);
        } else {
            $award = 0.0;
        }

        if ($award < 0) {
            $award = 0.0;
        }
        if ($award > $held) {
            $award = $held;
        }

        return $award;
    }

    private function providerOf(NeedMilestone $milestone): string
    {
        $request = \Modules\Needs\Entities\NeedRequest::find($milestone->need_request_id);
        $offer = $request?->acceptedOffer;

        return (string) ($offer?->provider_id ?? '');
    }

    private function recordEvent(NeedMilestone $milestone, Request $request, string $action, string $note): void
    {
        try {
            $needRequest = \Modules\Needs\Entities\NeedRequest::find($milestone->need_request_id);

            NeedRequestEvent::create([
                'need_request_id' => $milestone->need_request_id,
                'actor_id' => $request->user()->id,
                'from_status' => $needRequest?->status,
                'to_status' => $needRequest?->status ?? NeedRequest::STATUS_DISPUTED,
                'action' => $action,
                'note' => $note,
            ]);
        } catch (\Throwable) {
            // The timeline must never break the money path.
        }
    }
}
