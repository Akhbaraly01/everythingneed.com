<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\JobSeekers\Entities\WorkerProfile;
use Modules\JobSeekers\Entities\WorkOffer;
use Modules\JobSeekers\Entities\WorkRequest;

/**
 * W5: work-market demo rows so the seeker journey (request -> offer ->
 * accept -> pay -> complete -> rate) and the admin job-application queue
 * have real data. Idempotent: demo rows carry a DEMO: title marker.
 */
class WorkMarketDemoSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@everythingneed.com')->first();
        $workerUser = User::where('email', 'daniel.worker@everythingneed.com')->first();
        if ($customer === null || $workerUser === null) {
            return;
        }

        $profile = WorkerProfile::where('user_id', $workerUser->id)->first();
        if ($profile === null) {
            return;
        }

        if (WorkRequest::where('title', 'like', 'DEMO:%')->exists()) {
            return;
        }

        $open = WorkRequest::create([
            'requester_id' => $customer->id,
            'worker_profile_id' => $profile->id,
            'title' => 'DEMO: Fix compound wiring fault',
            'description' => 'Two rooms lost power after the rains. Need diagnosis and repair.',
            'category' => 'Electricians',
            'location' => 'East Legon, Accra',
            'budget_min' => 100,
            'budget_max' => 150,
            'currency' => 'USD',
            'status' => 'open',
        ]);

        WorkOffer::create([
            'work_request_id' => $open->id,
            'worker_profile_id' => $profile->id,
            'proposed_by' => 'worker',
            'rate' => 120,
            'message' => 'I can inspect tomorrow morning and fix same day.',
            'status' => 'pending',
        ]);

        WorkRequest::create([
            'requester_id' => $customer->id,
            'worker_profile_id' => null,
            'title' => 'DEMO: Weekly deep cleaning',
            'description' => 'Four-bedroom house, every Saturday morning.',
            'category' => 'Domestic Staff',
            'location' => 'Osu, Accra',
            'budget_min' => 40,
            'budget_max' => 60,
            'currency' => 'USD',
            'status' => 'open',
        ]);

        // One pending job application for the admin queue.
        $post = \Modules\Jobs\Entities\JobPost::where('title', 'Solar Installation Technician')->first();
        if ($post !== null) {
            \Modules\Jobs\Entities\JobApplication::firstOrCreate(
                ['job_post_id' => $post->id, 'user_id' => $workerUser->id],
                [
                    'cover_letter' => 'Certified electrician with solar experience, keen to join VoltWorks.',
                    'resume_url' => null,
                    'status' => 'pending',
                ]
            );
        }
    }
}
