<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            $this->command?->error('TestUsersSeeder refuses to run outside local/testing.');

            return;
        }

        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@everythingneed.com', 'role' => 'super_admin'],
            ['name' => 'Administrator', 'email' => 'admin@everythingneed.com', 'role' => 'administrator'],
            ['name' => 'Platform Operations', 'email' => 'ops@everythingneed.com', 'role' => 'platform_ops'],
            ['name' => 'Security Admin', 'email' => 'security@everythingneed.com', 'role' => 'security_admin'],
            ['name' => 'Analytics Admin', 'email' => 'analytics@everythingneed.com', 'role' => 'analytics_admin'],
            ['name' => 'Orders Admin', 'email' => 'orders@everythingneed.com', 'role' => 'orders_admin'],
            ['name' => 'Wallet Admin', 'email' => 'wallet@everythingneed.com', 'role' => 'wallet_admin'],
            ['name' => 'Support Admin', 'email' => 'supportadmin@everythingneed.com', 'role' => 'support_admin'],
            ['name' => 'Real Estate Admin', 'email' => 'realestate@everythingneed.com', 'role' => 'real_estate_admin'],
            ['name' => 'Needs Admin', 'email' => 'needs@everythingneed.com', 'role' => 'needs_admin'],
            ['name' => 'Payout Reviewer', 'email' => 'payouts@everythingneed.com', 'role' => 'payout_reviewer'],
            ['name' => 'Refund Agent', 'email' => 'refunds@everythingneed.com', 'role' => 'refund_agent'],
            ['name' => 'Inventory Manager', 'email' => 'inventory@everythingneed.com', 'role' => 'inventory_manager'],
            ['name' => 'CMS Editor', 'email' => 'cmseditor@everythingneed.com', 'role' => 'cms_editor'],
            ['name' => 'Auditor', 'email' => 'auditor@everythingneed.com', 'role' => 'auditor'],
            ['name' => 'Analyst', 'email' => 'analyst@everythingneed.com', 'role' => 'analyst'],
            ['name' => 'Vendor Admin', 'email' => 'vendor@everythingneed.com', 'role' => 'vendor_admin'],
            ['name' => 'Content Manager', 'email' => 'content@everythingneed.com', 'role' => 'content_manager'],
            ['name' => 'Healthcare Admin', 'email' => 'healthcare@everythingneed.com', 'role' => 'healthcare_admin'],
            ['name' => 'Support Agent', 'email' => 'support@everythingneed.com', 'role' => 'support_agent'],
            ['name' => 'Learning Admin', 'email' => 'learning@everythingneed.com', 'role' => 'learning_admin'],
            ['name' => 'Finance Admin', 'email' => 'finance@everythingneed.com', 'role' => 'finance_admin'],
            ['name' => 'Learning Reviewer', 'email' => 'learnreviewer@everythingneed.com', 'role' => 'learning_reviewer'],
            ['name' => 'Marketplace Admin', 'email' => 'marketplace@everythingneed.com', 'role' => 'marketplace_admin'],
            ['name' => 'Moderator', 'email' => 'moderator@everythingneed.com', 'role' => 'moderator'],
            ['name' => 'Customer Service', 'email' => 'cs@everythingneed.com', 'role' => 'customer_service'],
            ['name' => 'Hotel Admin', 'email' => 'hotel@everythingneed.com', 'role' => 'hotel_admin'],
            ['name' => 'Food Admin', 'email' => 'food@everythingneed.com', 'role' => 'food_admin'],
            ['name' => 'Transport Admin', 'email' => 'transport@everythingneed.com', 'role' => 'transport_admin'],
            ['name' => 'Agriculture Admin', 'email' => 'agriculture@everythingneed.com', 'role' => 'agriculture_admin'],
            ['name' => 'Building Admin', 'email' => 'building@everythingneed.com', 'role' => 'building_admin'],
            ['name' => 'Jobs Admin', 'email' => 'jobs@everythingneed.com', 'role' => 'jobs_admin'],
            ['name' => 'Pharmacy Admin', 'email' => 'pharmacy@everythingneed.com', 'role' => 'pharmacy_admin'],
            ['name' => 'Needs Viewer', 'email' => 'needsviewer@everythingneed.com', 'role' => 'needs_viewer'],
            ['name' => 'KYC Reviewer', 'email' => 'kyc@everythingneed.com', 'role' => 'kyc_reviewer'],
            ['name' => 'Category Admin', 'email' => 'categoryadmin@everythingneed.com', 'role' => 'category_admin'],
            ['name' => 'Vendor Manager', 'email' => 'vendormanager@everythingneed.com', 'role' => 'vendor_manager'],
            ['name' => 'Content Admin', 'email' => 'contentadmin@everythingneed.com', 'role' => 'content_admin'],
            ['name' => 'Daniel Mensah (Worker)', 'email' => 'daniel.worker@everythingneed.com', 'role' => 'worker'],
            ['name' => 'Regular User', 'email' => 'user@everythingneed.com', 'role' => 'user'],
            ['name' => 'Test Customer', 'email' => 'customer@everythingneed.com', 'role' => 'user'],
        ];

        foreach ($users as $u) {
            $user = User::query()->updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => Hash::make('Password1'),
                    // Local/dev accounts must pass the web `verified` gate
                    // (e.g. /dashboard sits behind auth+verified).
                    'email_verified_at' => now(),
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

        // Marketplace admins are scoped by category_id; an unassigned scope
        // fails closed to an empty approvals queue. Give local dev accounts
        // a real category so the console has data to show.
        $assignedCategoryId = DB::table('categories')->orderBy('name')->value('id');

        if ($assignedCategoryId) {
            UserRole::query()
                ->where('role', 'marketplace_admin')
                ->whereNull('category_id')
                ->update(['category_id' => $assignedCategoryId]);
        }
    }
}
