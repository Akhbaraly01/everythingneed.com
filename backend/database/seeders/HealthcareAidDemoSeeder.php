<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Healthcare\Entities\AidDonation;
use Modules\Healthcare\Entities\AidRequest;

/**
 * H-C aid / charity demo data: community aid requests across the review
 * lifecycle (pending, approved with donations, funded, rejected) so the
 * public listing, requester surface and admin queue are never empty.
 * Idempotent via idempotency_key (AID-DEMO-*).
 */
class HealthcareAidDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        $user = User::where('email', 'user@everythingneed.com')->first();
        if (!$customer) {
            return;
        }

        $healthcare = User::where('email', 'healthcare@everythingneed.com')->first();

        // Approved with real donation rows (public listing).
        $dialysis = AidRequest::firstOrCreate(
            ['idempotency_key' => 'AID-DEMO-1'],
            [
                'user_id' => $customer->id,
                'title' => 'DEMO: Dialysis support for Ama',
                'description' => 'Ama needs three dialysis sessions a week for the next month. The family covers transport but not the session fees. Any help keeps her treatment uninterrupted.',
                'category' => 'medical',
                'goal_amount' => 1200,
                'raised_amount' => 0,
                'currency' => 'USD',
                'status' => AidRequest::STATUS_APPROVED,
                'reviewed_by' => $healthcare?->id,
                'reviewed_at' => now()->subDays(6),
            ]
        );

        // Funded example (goal fully raised via real donations).
        $insulin = AidRequest::firstOrCreate(
            ['idempotency_key' => 'AID-DEMO-2'],
            [
                'user_id' => $customer->id,
                'title' => 'DEMO: Insulin for Kwame',
                'description' => 'Kwame, 14, was recently diagnosed with Type 1 diabetes. This covers three months of insulin and test strips.',
                'category' => 'medication',
                'goal_amount' => 300,
                'raised_amount' => 0,
                'currency' => 'USD',
                'status' => AidRequest::STATUS_FUNDED,
                'reviewed_by' => $healthcare?->id,
                'reviewed_at' => now()->subDays(14),
            ]
        );

        // Pending (admin review queue).
        AidRequest::firstOrCreate(
            ['idempotency_key' => 'AID-DEMO-3'],
            [
                'user_id' => $customer->id,
                'title' => 'DEMO: Emergency transport after accident',
                'description' => 'An accident left two community members needing follow-up clinic visits across town for the next six weeks.',
                'category' => 'emergency',
                'goal_amount' => 250,
                'raised_amount' => 0,
                'currency' => 'USD',
                'status' => AidRequest::STATUS_PENDING,
            ]
        );

        // Rejected (requester surface shows the reason).
        AidRequest::firstOrCreate(
            ['idempotency_key' => 'AID-DEMO-4'],
            [
                'user_id' => $customer->id,
                'title' => 'DEMO: Vague request - closed',
                'description' => 'Needs more information from the requester about the medical provider and cost breakdown.',
                'category' => 'other',
                'goal_amount' => 500,
                'raised_amount' => 0,
                'currency' => 'USD',
                'status' => AidRequest::STATUS_REJECTED,
                'reviewed_by' => $healthcare?->id,
                'reviewed_at' => now()->subDays(3),
                'rejection_reason' => 'Please resubmit with a letter from the treating facility and an itemised cost estimate.',
            ]
        );

        // Real donation rows so raised_amount always matches the ledger.
        if ($user) {
            AidDonation::firstOrCreate(
                ['aid_request_id' => $dialysis->id, 'donor_id' => $user->id],
                ['amount' => 120, 'currency' => 'USD', 'status' => AidDonation::STATUS_COMPLETED]
            );
            AidDonation::firstOrCreate(
                ['aid_request_id' => $insulin->id, 'donor_id' => $user->id],
                ['amount' => 300, 'currency' => 'USD', 'status' => AidDonation::STATUS_COMPLETED]
            );
        }

        // Keep raised_amount honest against real donation rows.
        foreach ([$dialysis, $insulin] as $aid) {
            $sum = (float) AidDonation::where('aid_request_id', $aid->id)->sum('amount');
            if ((float) $aid->raised_amount !== $sum) {
                $aid->update(['raised_amount' => $sum]);
            }
        }
    }
}
