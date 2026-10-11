<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * W5: local job board. Replaces the foreign demo rows (SF/NY/LA) that
 * DemoDataSeeder::seedJobs() planted with West-African + remote listings.
 * Idempotent: foreign titles are removed, local rows keyed by title.
 */
class JobsDemoSeeder extends Seeder
{
    public function run(): void
    {
        $uid = DB::table('users')->orderBy('created_at')->value('id');
        if ($uid === null) {
            return;
        }

        // Retire the foreign demo rows from earlier seeds.
        DB::table('job_posts')->whereIn('title', [
            'Senior React Developer',
            'Full Stack Engineer',
        ])->delete();

        $now = now();
        $locals = [
            [
                'title' => 'Senior Frontend Engineer',
                'company' => 'Accra Tech Hub',
                'description' => 'Lead our storefront experience squad building React + Inertia interfaces.',
                'location' => 'Accra, Ghana',
                'job_type' => 'full_time',
                'salary_min' => 45000, 'salary_max' => 65000,
                'requirements' => ['5+ years React', 'TypeScript', 'Inertia.js'],
            ],
            [
                'title' => 'Registered Nurse',
                'company' => 'Korle-Bu Teaching Hospital',
                'description' => 'Join the emergency nursing team on rotating shifts.',
                'location' => 'Accra, Ghana',
                'job_type' => 'full_time',
                'salary_min' => 12000, 'salary_max' => 18000,
                'requirements' => ['BSc Nursing', 'Valid practicing license'],
            ],
            [
                'title' => 'Marketing Manager',
                'company' => 'GrowthAfrica Ltd',
                'description' => 'Own growth marketing across Ghana and Nigeria.',
                'location' => 'Lagos, Nigeria',
                'job_type' => 'full_time',
                'salary_min' => 20000, 'salary_max' => 30000,
                'requirements' => ['3+ years marketing management'],
            ],
            [
                'title' => 'Full-Stack Engineer (Laravel/React)',
                'company' => 'MarketStack Remote',
                'description' => 'Build marketplace APIs and seller tooling, fully remote.',
                'location' => 'Remote',
                'job_type' => 'contract',
                'salary_min' => 30000, 'salary_max' => 48000,
                'requirements' => ['3+ years Laravel', 'React'],
            ],
            [
                'title' => 'Restaurant Manager',
                'company' => 'Grand Kitchen',
                'description' => 'Run daily operations at our Kumasi flagship.',
                'location' => 'Kumasi, Ghana',
                'job_type' => 'full_time',
                'salary_min' => 9000, 'salary_max' => 14000,
                'requirements' => ['5+ years restaurant management'],
            ],
            [
                'title' => 'Solar Installation Technician',
                'company' => 'VoltWorks Ltd',
                'description' => 'Install and maintain residential solar systems across Tema.',
                'location' => 'Tema, Ghana',
                'job_type' => 'contract',
                'salary_min' => 6000, 'salary_max' => 9600,
                'requirements' => ['Electrical certification', '2+ years field work'],
            ],
        ];

        foreach ($locals as $job) {
            $exists = DB::table('job_posts')->where('title', $job['title'])->exists();
            if ($exists) {
                DB::table('job_posts')->where('title', $job['title'])->update([
                    'company' => $job['company'],
                    'description' => $job['description'],
                    'location' => $job['location'],
                    'job_type' => $job['job_type'],
                    'salary_min' => $job['salary_min'],
                    'salary_max' => $job['salary_max'],
                    'requirements' => json_encode($job['requirements']),
                    'is_active' => true,
                    'updated_at' => $now,
                ]);
                continue;
            }

            DB::table('job_posts')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $uid,
                'title' => $job['title'],
                'company' => $job['company'],
                'description' => $job['description'],
                'location' => $job['location'],
                'job_type' => $job['job_type'],
                'salary_min' => $job['salary_min'],
                'salary_max' => $job['salary_max'],
                'requirements' => json_encode($job['requirements']),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
