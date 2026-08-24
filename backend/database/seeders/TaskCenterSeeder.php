<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Modules\Needs\Entities\TaskPost;

class TaskCenterSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'user@everythingneed.com')->first()
            ?? User::factory()->create(['name' => 'Demo Requester', 'email' => 'user@everythingneed.com']);

        $tasks = [
            [
                'title' => 'Transcribe 30 minutes of interview audio',
                'description' => "We have three recorded interviews (about 10 minutes each) that need accurate English transcription.\n\nDeliverable: one Google Doc with timestamps. Accuracy above 95%.",
                'quantity' => 3,
                'budget' => 45.00,
                'deadline' => now()->addDays(7)->toDateString(),
                'requirements' => ['Excellent written English', 'Previous transcription experience preferred'],
            ],
            [
                'title' => 'Photograph 20 menu items for restaurant listing',
                'description' => "Our partner restaurant needs appetizing photos of 20 dishes for their EverythingNeed food page.\n\nNatural light or provided lighting both fine; deliver edited JPGs.",
                'quantity' => 20,
                'budget' => 180.00,
                'deadline' => now()->addDays(14)->toDateString(),
                'requirements' => ['Own a DSLR or mirrorless camera', 'Portfolio of food photography'],
            ],
            [
                'title' => 'Translate product descriptions EN → FR (50 items)',
                'description' => "E-commerce catalogue translation. Keep brand names untranslated, adapt measurements.\n\nSpreadsheet provided; same format returned.",
                'quantity' => 50,
                'budget' => 120.00,
                'deadline' => now()->addDays(10)->toDateString(),
                'requirements' => ['Native-level French', 'E-commerce copy experience a plus'],
            ],
            [
                'title' => 'Distribute 500 flyers across Osu neighbourhood',
                'description' => "Hand out flyers at the marked intersections over one weekend. Photo confirmation of stacks remaining per checkpoint required as evidence.",
                'quantity' => 500,
                'budget' => 60.00,
                'deadline' => now()->addDays(5)->toDateString(),
                'requirements' => ['Based in Accra (Osu area)', 'Reliable smartphone for evidence photos'],
            ],
        ];

        foreach ($tasks as $data) {
            TaskPost::create($data + [
                'created_by' => $owner->id,
                'post_number' => 'TK-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)),
                'status' => TaskPost::STATUS_OPEN,
            ]);
        }
    }
}
