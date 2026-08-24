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

        // Create Support Staff
        $support = User::factory()->create([
            'name' => 'Support Staff',
            'email' => 'support@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $support->id, 'role' => 'support_staff']);

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

        // Create Moderator
        $moderator = User::factory()->create([
            'name' => 'Moderator',
            'email' => 'moderator@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $moderator->id, 'role' => 'moderator']);

        // Create Category Admin
        $catAdmin = User::factory()->create([
            'name' => 'Category Admin',
            'email' => 'category@everythingneed.com',
        ]);
        UserRole::create(['user_id' => $catAdmin->id, 'role' => 'category_admin']);

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
            'full_name' => 'Dr. John Smith',
            'specialization' => 'Cardiology',
            'qualification' => 'MD, MBBS',
            'experience_years' => 15,
            'consultation_fee' => 150,
            'is_available' => true,
            'rating' => 4.8,
        ]);

        $doctor2 = Doctor::create([
            'full_name' => 'Dr. Sarah Johnson',
            'specialization' => 'Neurology',
            'qualification' => 'MD, DM Neurology',
            'experience_years' => 12,
            'consultation_fee' => 200,
            'is_available' => true,
            'rating' => 4.9,
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

        // Seed demo data for all modules
        $this->call(DemoDataSeeder::class);

        // Seed job seeker worker profiles
        $this->call(JobSeekersSeeder::class);

        // Seed task center demo tasks
        $this->call(TaskCenterSeeder::class);
    }
}
