<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use App\Models\UserRole;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LocalAccessSeeder extends Seeder
{
    public function run(): void
    {
        $this->ensureUser('super@everythingneed.com', 'Super Admin', 'super_admin');
        $this->ensureUser('admin@everythingneed.com', 'Administrator', 'administrator');
        $this->ensureUser('user@everythingneed.com', 'John Customer', 'user');
    }

    private function ensureUser(string $email, string $name, string $role): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
            ]
        );

        Profile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'email' => $email,
                'full_name' => $name,
            ]
        );

        Wallet::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'balance' => 0,
                'currency' => 'USD',
            ]
        );

        UserRole::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'role' => $role,
            ],
            [
                'category_id' => null,
            ]
        );
    }
}
