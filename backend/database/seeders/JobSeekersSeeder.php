<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Modules\JobSeekers\Entities\WorkerProfile;

class JobSeekersSeeder extends Seeder
{
    public function run(): void
    {
        $workers = [
            [
                'name' => 'Daniel Mensah',
                'email' => 'daniel.worker@everythingneed.com',
                'headline' => 'Certified Electrician — residential & commercial wiring',
                'bio' => '12 years of hands-on electrical installation, fault finding and solar setups. Safety-first approach.',
                'category' => 'Electricians',
                'skills' => [
                    ['name' => 'House wiring', 'level' => 'expert'],
                    ['name' => 'Solar installation', 'level' => 'advanced'],
                    ['name' => 'Fault diagnosis', 'level' => 'expert'],
                ],
                'experience' => [
                    ['title' => 'Lead Electrician', 'company' => 'VoltWorks Ltd', 'from' => '2018', 'to' => 'present'],
                    ['title' => 'Apprentice Electrician', 'company' => 'PowerLine Co', 'from' => '2014', 'to' => '2018'],
                ],
                'education' => [
                    ['institution' => 'Accra Technical Institute', 'degree' => 'Electrical Engineering Diploma', 'year' => '2013'],
                ],
                'portfolio' => [],
                'hourly_rate' => 18.00,
                'daily_rate' => 130.00,
                'availability' => 'available',
                'city' => 'Accra',
                'country' => 'Ghana',
                'rating_avg' => 4.80,
                'rating_count' => 34,
                'completed_jobs' => 61,
                'is_verified' => true,
            ],
            [
                'name' => 'Grace Owusu',
                'email' => 'grace.worker@everythingneed.com',
                'headline' => 'Professional Housekeeper & Child Caregiver',
                'bio' => 'Detail-oriented housekeeping with 8 years of family home experience. First-aid certified.',
                'category' => 'Domestic Staff',
                'skills' => [
                    ['name' => 'Deep cleaning', 'level' => 'expert'],
                    ['name' => 'Child care', 'level' => 'expert'],
                    ['name' => 'Meal preparation', 'level' => 'advanced'],
                ],
                'experience' => [
                    ['title' => 'Household Manager', 'family residence', 'from' => '2019', 'to' => 'present'],
                ],
                'education' => [],
                'portfolio' => [],
                'hourly_rate' => 9.50,
                'daily_rate' => 65.00,
                'availability' => 'available',
                'city' => 'Kumasi',
                'country' => 'Ghana',
                'rating_avg' => 4.90,
                'rating_count' => 52,
                'completed_jobs' => 88,
                'is_verified' => true,
            ],
            [
                'name' => 'Kwame Boateng',
                'email' => 'kwame.worker@everythingneed.com',
                'headline' => 'Full-Stack Developer (Laravel · React · PostgreSQL)',
                'bio' => 'I build complete web platforms and integrations. Comfortable with modular monolith architectures.',
                'category' => 'Technology',
                'skills' => [
                    ['name' => 'PHP / Laravel', 'level' => 'expert'],
                    ['name' => 'React + TypeScript', 'level' => 'advanced'],
                    ['name' => 'PostgreSQL', 'level' => 'advanced'],
                ],
                'experience' => [
                    ['title' => 'Freelance Developer', 'self-employed', 'from' => '2021', 'to' => 'present'],
                ],
                'education' => [
                    ['institution' => 'KNUST', 'degree' => 'BSc Computer Science', 'year' => '2020'],
                ],
                'portfolio' => [
                    ['title' => 'Logistics tracking portal', 'url' => '#', 'description' => 'Realtime fleet dashboard.'],
                ],
                'hourly_rate' => 35.00,
                'daily_rate' => 250.00,
                'availability' => 'busy',
                'city' => 'Takoradi',
                'country' => 'Ghana',
                'rating_avg' => 4.70,
                'rating_count' => 19,
                'completed_jobs' => 27,
                'is_verified' => false,
            ],
            [
                'name' => 'Abena Danso',
                'email' => 'abena.worker@everythingneed.com',
                'headline' => 'Farm Supervisor — crop planning & harvest crews',
                'bio' => 'Agronomy background; manages planting schedules and leads seasonal harvesting teams of 10+.',
                'category' => 'Agriculture',
                'skills' => [
                    ['name' => 'Crop rotation planning', 'level' => 'advanced'],
                    ['name' => 'Team supervision', 'level' => 'expert'],
                    ['name' => 'Irrigation systems', 'level' => 'intermediate'],
                ],
                'experience' => [
                    ['title' => 'Field Supervisor', 'GreenFields Farms', 'from' => '2017', 'to' => 'present'],
                ],
                'education' => [
                    ['institution' => 'University of Ghana', 'degree' => 'BSc Agriculture', 'year' => '2016'],
                ],
                'portfolio' => [],
                'hourly_rate' => 11.00,
                'daily_rate' => 80.00,
                'availability' => 'unavailable',
                'city' => 'Ho',
                'country' => 'Ghana',
                'rating_avg' => 4.60,
                'rating_count' => 23,
                'completed_jobs' => 41,
                'is_verified' => true,
            ],
            [
                'name' => 'Yaw Frimpong',
                'email' => 'yaw.worker@everythingneed.com',
                'headline' => 'Plumber & Pipefitting Specialist',
                'bio' => 'Emergency repairs, bathroom fittings, borehole pump installs. Fast response within city limits.',
                'category' => 'Plumbers',
                'skills' => [
                    ['name' => 'Pipe fitting', 'level' => 'expert'],
                    ['name' => 'Borehole pumps', 'level' => 'advanced'],
                ],
                'experience' => [
                    ['title' => 'Plumber', 'AquaFix Services', 'from' => '2015', 'to' => 'present'],
                ],
                'education' => [],
                'portfolio' => [],
                'hourly_rate' => 15.00,
                'daily_rate' => 110.00,
                'availability' => 'available',
                'city' => 'Accra',
                'country' => 'Ghana',
                'rating_avg' => 4.40,
                'rating_count' => 31,
                'completed_jobs' => 55,
                'is_verified' => false,
            ],
        ];

        foreach ($workers as $data) {
            $user = User::factory()->create([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);
            UserRole::create(['user_id' => $user->id, 'role' => 'worker']);

            WorkerProfile::create([
                'user_id' => $user->id,
                'headline' => $data['headline'],
                'bio' => $data['bio'],
                'category' => $data['category'],
                'skills' => $data['skills'],
                'experience' => $data['experience'],
                'education' => $data['education'],
                'portfolio' => $data['portfolio'],
                'hourly_rate' => $data['hourly_rate'],
                'daily_rate' => $data['daily_rate'],
                'currency' => 'USD',
                'availability' => $data['availability'],
                'city' => $data['city'],
                'country' => $data['country'],
                'rating_avg' => $data['rating_avg'],
                'rating_count' => $data['rating_count'],
                'completed_jobs' => $data['completed_jobs'],
                'is_verified' => $data['is_verified'],
            ]);
        }
    }
}
