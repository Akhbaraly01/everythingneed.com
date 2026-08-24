<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FeatureFlagSeeder extends Seeder
{
    private const FLAGS = [
        [
            'key'         => 'pharmacy_module',
            'name'        => 'Pharmacy Module',
            'description' => 'Enable online medicine ordering and pharmacy features',
            'enabled'     => true,
        ],
        [
            'key'         => 'rides_module',
            'name'        => 'Rides Module',
            'description' => 'Enable ride-hailing and transportation services',
            'enabled'     => false,
        ],
        [
            'key'         => 'hotels_module',
            'name'        => 'Hotels Module',
            'description' => 'Enable hotel booking and reservation features',
            'enabled'     => true,
        ],
        [
            'key'         => 'food_module',
            'name'        => 'Food Module',
            'description' => 'Enable food ordering and restaurant features',
            'enabled'     => true,
        ],
        [
            'key'         => 'jobs_module',
            'name'        => 'Jobs Module',
            'description' => 'Enable job postings and application features',
            'enabled'     => false,
        ],
        [
            'key'         => 'real_estate_module',
            'name'        => 'Real Estate Module',
            'description' => 'Enable property listings and real estate features',
            'enabled'     => false,
        ],
        [
            'key'         => 'ai_chat',
            'name'        => 'AI Chat Assistant',
            'description' => 'Enable AI-powered chatbot for customer support',
            'enabled'     => true,
        ],
        [
            'key'         => 'healthcare_module',
            'name'        => 'Healthcare Module',
            'description' => 'Enable doctor consultations and healthcare features',
            'enabled'     => true,
        ],
    ];

    public function run(): void
    {
        foreach (self::FLAGS as $flag) {
            DB::table('feature_flags')->updateOrInsert(
                ['key' => $flag['key']],
                [
                    'id'          => Str::uuid()->toString(),
                    'name'        => $flag['name'],
                    'description' => $flag['description'],
                    'is_enabled'  => $flag['enabled'],
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]
            );
        }
    }
}
