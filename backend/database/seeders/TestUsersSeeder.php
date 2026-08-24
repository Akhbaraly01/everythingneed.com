<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@everythingneed.com', 'role' => 'super_admin'],
            ['name' => 'Administrator', 'email' => 'admin@everythingneed.com', 'role' => 'administrator'],
            ['name' => 'Vendor Admin', 'email' => 'vendor@everythingneed.com', 'role' => 'vendor_admin'],
            ['name' => 'Content Manager', 'email' => 'content@everythingneed.com', 'role' => 'content_manager'],
            ['name' => 'Healthcare Admin', 'email' => 'healthcare@everythingneed.com', 'role' => 'healthcare_admin'],
            ['name' => 'Support Staff', 'email' => 'support@everythingneed.com', 'role' => 'support_staff'],
            ['name' => 'Learning Admin', 'email' => 'learning@everythingneed.com', 'role' => 'learning_admin'],
            ['name' => 'Finance Admin', 'email' => 'finance@everythingneed.com', 'role' => 'finance_admin'],
            ['name' => 'Regular User', 'email' => 'user@everythingneed.com', 'role' => 'user'],
            ['name' => 'Test Customer', 'email' => 'customer@everythingneed.com', 'role' => 'user'],
        ];

        foreach ($users as $u) {
            $user = User::query()->updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make('Password1'),
                ]
            );

            UserRole::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'role' => $u['role'],
                ],
                ['category_id' => null]
            );

            $this->command->info("{$u['email']} ({$u['role']}) - Password: Password1");
        }
    }
}
