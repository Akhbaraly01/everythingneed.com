<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserRole;
use Modules\Vendors\Entities\Vendor;
use Modules\Products\Entities\Product;
use Modules\Healthcare\Entities\Doctor;
use Modules\Healthcare\Entities\Department;
use Modules\Subscriptions\Entities\Plan;
use Modules\Messaging\Entities\Department as TicketDepartment;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Never provision known-credential admins outside local/testing.
        if (!app()->environment(['local', 'testing'])) {
            $this->command?->error('DatabaseSeeder refuses to run outside local/testing.');
            return;
        }

        // Create Super Admin
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'super@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $admin->id, 'role' => 'super_admin']);

        // Create Administrator
        $adminUser = User::factory()->create([
            'name' => 'Administrator',
            'email' => 'admin@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $adminUser->id, 'role' => 'administrator']);

        // Create Customer Service
        $cs = User::factory()->create([
            'name' => 'Customer Service',
            'email' => 'cs@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $cs->id, 'role' => 'customer_service']);

        // Create Support Agent
        $support = User::factory()->create([
            'name' => 'Support Agent',
            'email' => 'support@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $support->id, 'role' => 'support_agent']);

        // Create Content Manager
        $cm = User::factory()->create([
            'name' => 'Content Manager',
            'email' => 'content@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $cm->id, 'role' => 'content_manager']);

        // Create Finance Admin
        $finance = User::factory()->create([
            'name' => 'Finance Admin',
            'email' => 'finance@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $finance->id, 'role' => 'finance_admin']);

        // Create Healthcare Admin
        $healthcare = User::factory()->create([
            'name' => 'Healthcare Admin',
            'email' => 'healthcare@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $healthcare->id, 'role' => 'healthcare_admin']);

        // Create Learning Admin
        $learning = User::factory()->create([
            'name' => 'Learning Admin',
            'email' => 'learning@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $learning->id, 'role' => 'learning_admin']);

        // Create Vendor Admin
        $vendorAdmin = User::factory()->create([
            'name' => 'Vendor Admin',
            'email' => 'vendor@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $vendorAdmin->id, 'role' => 'vendor_admin']);

        // The vendor account must own a vendors row, otherwise the vendor
        // portal, payouts and dashboard metrics have nothing to resolve to.
        Vendor::query()->firstOrCreate(
            ['user_id' => $vendorAdmin->id],
            [
                'store_name' => 'Vendor Admin Store',
                'category' => 'General',
                'description' => 'Local development vendor account.',
                'is_verified' => true,
                'rating' => 0,
            ]
        );

        // Create Moderator
        $moderator = User::factory()->create([
            'name' => 'Moderator',
            'email' => 'moderator@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);

        // Create Marketplace Admin
        $catAdmin = User::factory()->create([
            'name' => 'Marketplace Admin',
            'email' => 'category@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $catAdmin->id, 'role' => 'marketplace_admin']);

        // Create Regular Customer
        $customer = User::factory()->create([
            'name' => 'John Customer',
            'email' => 'user@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $customer->id, 'role' => 'user']);

        // Create Departments
        $billingDept = TicketDepartment::create(['name' => 'Billing']);
        $techDept = TicketDepartment::create(['name' => 'Technical Support']);
        $generalDept = TicketDepartment::create(['name' => 'General']);

        // Create Healthcare Departments
        $cardiology = Department::create(['name' => 'Cardiology']);
        $neurology = Department::create(['name' => 'Neurology']);
        $orthopedics = Department::create(['name' => 'Orthopedics']);

        // Create Doctors
        $doctor1 = Doctor::create([
            'full_name' => 'Dr. Ama Serwaa',
            'specialization' => 'Cardiology',
            'profession' => 'doctor',
            'qualification' => 'MD, MBBS',
            'experience_years' => 15,
            'consultation_fee' => 150,
            'virtual_fee' => 100,
            'home_visit_fee' => 200,
            'is_available' => true,
            'rating' => 4.8,
        ]);

        $doctor2 = Doctor::create([
            'full_name' => 'Dr. Kwame Mensah',
            'specialization' => 'Neurology',
            'profession' => 'doctor',
            'qualification' => 'MD, DM Neurology',
            'experience_years' => 12,
            'consultation_fee' => 200,
            'virtual_fee' => 150,
            'home_visit_fee' => 250,
            'is_available' => true,
            'rating' => 4.9,
        ]);

        // Additional professionals for profession filtering demo
        $nurse1 = Doctor::create([
            'full_name' => 'Nurse Akua Owusu',
            'specialization' => 'General Nursing',
            'profession' => 'nurse',
            'qualification' => 'RN, BSc Nursing',
            'experience_years' => 8,
            'consultation_fee' => 80,
            'virtual_fee' => 60,
            'home_visit_fee' => 120,
            'is_available' => true,
            'rating' => 4.7,
        ]);

        $chew1 = Doctor::create([
            'full_name' => 'CHEW Kofi Amoako',
            'specialization' => 'Community Health',
            'profession' => 'chew',
            'qualification' => 'CHEW Certificate',
            'experience_years' => 5,
            'consultation_fee' => 50,
            'virtual_fee' => 40,
            'home_visit_fee' => 80,
            'is_available' => true,
            'rating' => 4.5,
        ]);

        $pharmacist1 = Doctor::create([
            'full_name' => 'Pharmacist Yaa Asantewaa',
            'specialization' => 'Clinical Pharmacy',
            'profession' => 'pharmacist',
            'qualification' => 'PharmD',
            'experience_years' => 10,
            'consultation_fee' => 100,
            'virtual_fee' => 80,
            'home_visit_fee' => 150,
            'is_available' => true,
            'rating' => 4.6,
        ]);

        $labScientist1 = Doctor::create([
            'full_name' => 'Lab Scientist Nana Boateng',
            'specialization' => 'Medical Laboratory Science',
            'profession' => 'medical_laboratory_scientist',
            'qualification' => 'BSc MLS',
            'experience_years' => 7,
            'consultation_fee' => 70,
            'virtual_fee' => 60,
            'home_visit_fee' => 100,
            'is_available' => true,
            'rating' => 4.4,
        ]);

        // Create Vendors
        $vendor1 = Vendor::create([
            'user_id' => $adminUser->id,
            'store_name' => 'TechStore',
            'category' => 'electronics',
            'description' => 'Premium electronics retailer',
            'is_verified' => true,
            'rating' => 4.5,
        ]);

        $vendor2 = Vendor::create([
            'user_id' => $cs->id,
            'store_name' => 'FashionHub',
            'category' => 'clothing',
            'description' => 'Latest fashion trends',
            'is_verified' => true,
            'rating' => 4.3,
        ]);

        // Create Products
        Product::factory()->count(20)->create([
            'vendor_id' => $vendor1->id,
            'category' => 'electronics',
        ]);

        Product::factory()->count(15)->create([
            'vendor_id' => $vendor2->id,
            'category' => 'clothing',
        ]);

        // Create Plans
        Plan::create([
            'name' => 'Basic',
            'slug' => 'basic',
            'description' => 'Basic plan features',
            'price' => 9.99,
            'currency' => 'USD',
            'interval' => 'monthly',
            'features' => json_encode(['feature1', 'feature2']),
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'description' => 'Professional plan features',
            'price' => 29.99,
            'currency' => 'USD',
            'interval' => 'monthly',
            'features' => json_encode(['feature1', 'feature2', 'feature3', 'feature4']),
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Enterprise',
            'slug' => 'enterprise',
            'description' => 'Enterprise plan features',
            'price' => 99.99,
            'currency' => 'USD',
            'interval' => 'yearly',
            'features' => json_encode(['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']),
            'is_active' => true,
        ]);

        // Create Demo Users
        for ($i = 0; $i < 10; $i++) {
            $demoUser = User::factory()->create();
            UserRole::create(['user_id' => $demoUser->id, 'role' => 'user']);
        }

        // Seed feature flags
        $this->call(FeatureFlagSeeder::class);

        // Seed starter CMS content (pages, blog, banner, announcement)
        $this->call(CmsSeeder::class);

        // Seed starter no-code modules (W3: proves the dynamic plane live)
        $this->call(DynamicModuleSeeder::class);

        // Seed demo data for all modules
        $this->call(DemoDataSeeder::class);

        // Local product imagery (W1): replaces dead external image URLs
        // left by faker with GD-generated seed cards + media rows.
        $this->call(ProductImageSeeder::class);

        // Seed job seeker worker profiles
        $this->call(JobSeekersSeeder::class);

        // Seed task center demo tasks
        $this->call(TaskCenterSeeder::class);

        // Seed a demo chat conversation
        $this->call(MessagingSeeder::class);

        // Seed the granular RBAC matrix
        $this->call(PermissionSeeder::class);

        // Seed starter public menus (header/footer/mobile/category/more)
        $this->call(NavigationSeeder::class);

        // Seed shipping rates (Standard/Express with free-over-threshold)
        $this->call(ShippingRateSeeder::class);

        // Give the marketplace_admin a real assigned category: server-side
        // scoping (approvals queue + dashboard) reads user_roles.category_id,
        // and an unassigned scope fails closed to an empty queue.
        $assignedCategoryId = \Illuminate\Support\Facades\DB::table('categories')
            ->orderBy('name')
            ->value('id');

        if ($assignedCategoryId) {
            \Illuminate\Support\Facades\DB::table('user_roles')
                ->where('user_id', $catAdmin->id)
                ->where('role', 'marketplace_admin')
                ->update(['category_id' => $assignedCategoryId]);
        }

        // Local access scaffolding (profiles + wallets; its ensureUser()
        // sets 'password' - runs before TestUsersSeeder so Password1 wins).
        $this->call(LocalAccessSeeder::class);

        // Canonical dev logins (Password1 + verified): MUST run last so its
        // passwords win over LocalAccessSeeder's 'password'. A fresh
        // `php artisan db:seed` therefore reproduces exactly the accounts the
        // runtime matrices and Playwright specs log in with.
        $this->call(TestUsersSeeder::class);

        // Pharmacy demo vertical (W4): catalogue top-up + one order per
        // lifecycle status for the canonical customer account. Runs after
        // TestUsersSeeder (needs customer@) and touches no credentials.
        $this->call(PharmacyDemoSeeder::class);

        // Jobs + work-market demo (W5): local job board (replaces the
        // foreign DemoDataSeeder rows) and seeker request/offer rows.
        $this->call(JobsDemoSeeder::class);
        $this->call(WorkMarketDemoSeeder::class);

        // Transport demo (W6): two local drivers + one ride per lifecycle
        // status for the canonical customer account.
        $this->call(TransportDemoSeeder::class);

        // Verticals demo (W10): needs requests + offers, a food order, a
        // building booking with real service workers, and an agriculture
        // farmer vendor.
        $this->call(VerticalsDemoSeeder::class);

        // Hotels demo (W11): reservations across the stay lifecycle
        // (confirmed, checked_in, cancelled) for the customer account.
        $this->call(HotelsDemoSeeder::class);

        // Learn demo (W12): a completed enrollment with a real
        // certificate, a partial enrollment, and a demo quiz attempt.
        $this->call(LearnDemoSeeder::class);

        // Learn free knowledge feed (gap 2): 81 approved video/text posts
        // (verified external videos + written guides) plus a live
        // moderation queue (pending/rejected/needs-information).
        $this->call(LearnFeedDemoSeeder::class);

        // Healthcare demo (W13): health tickets across the ticket
        // lifecycle (assigned, in_consultation, cancelled).
        $this->call(HealthcareDemoSeeder::class);

        // H-C aid / charity demo: community aid requests across the review
        // lifecycle (pending/approved/funded/rejected) with real donation rows.
        $this->call(HealthcareAidDemoSeeder::class);

        // H-B prescription lifecycle demo: active/expired/filled prescriptions
        // for the customer account, incl. one linked to a delivered order.
        $this->call(PrescriptionLifecycleSeeder::class);

        // Mega-phase M-1: service taxonomy (categories + subcategories +
        // icons) with demo services per root category; also re-links legacy
        // free-text service rows to the new taxonomy.
        $this->call(ServiceCategorySeeder::class);

        // Placeholder artwork for every other vertical (runs last so it
        // covers hotels/courses/needs/... created by the demo seeders above).
        $this->call(PlaceholderImageSeeder::class);

        // Home page builder (Home rebuild): admin-ordered storefront
        // sections + the products-per-batch setting. Idempotent.
        $this->call(HomePageSectionsSeeder::class);
    }
}
