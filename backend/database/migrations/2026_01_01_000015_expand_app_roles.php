<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Expand app roles documentation and add supporting tables.
 *
 * - Documents all valid roles on the user_roles.role column
 * - Creates system_settings table for admin settings storage
 * - Creates feature_flags table for feature flag management
 * - Creates audit_logs table for the audit trail
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Document valid roles on user_roles table (PostgreSQL comment)
        try {
            DB::statement("
                COMMENT ON COLUMN user_roles.role IS
                'Valid roles: super_admin, administrator, vendor_admin, moderator,
                 support_staff, content_manager, finance_admin, healthcare_admin,
                 learning_admin, customer_service, category_admin, user'
            ");
        } catch (\Throwable) {
            // Skip if table doesn't exist yet
        }

        // 2. Create system_settings table
        if (! Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('key', 100)->unique();
                $table->text('value')->nullable();
                $table->string('type', 20)->default('string'); // string|boolean|integer|json
                $table->string('group', 60)->default('general');
                $table->text('description')->nullable();
                $table->boolean('is_public')->default(false);
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
            });
        }

        // 3. Create feature_flags table
        if (! Schema::hasTable('feature_flags')) {
            Schema::create('feature_flags', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('key', 100)->unique();
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->boolean('enabled')->default(false);
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
            });

            // Seed default feature flags
            $now = now();
            DB::table('feature_flags')->insert([
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'marketplace',       'name' => 'Marketplace',        'description' => 'Enable vendor marketplace module',            'enabled' => true,  'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'healthcare',        'name' => 'Healthcare',         'description' => 'Enable telemedicine and pharmacy features',   'enabled' => true,  'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'learning',          'name' => 'Learning',           'description' => 'Enable courses and certifications module',    'enabled' => true,  'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'ai_recommendations','name' => 'AI Recommendations', 'description' => 'Enable AI-powered product recommendations',   'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'crypto_payments',   'name' => 'Crypto Payments',    'description' => 'Accept cryptocurrency for payments',          'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'multi_currency',    'name' => 'Multi-Currency',     'description' => 'Support multiple currencies internationally', 'enabled' => false, 'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'vendor_analytics',  'name' => 'Vendor Analytics',   'description' => 'Advanced analytics for vendors',              'enabled' => true,  'created_at' => $now, 'updated_at' => $now],
                ['id' => \Illuminate\Support\Str::uuid(), 'key' => 'two_factor_auth',   'name' => 'Two-Factor Auth',    'description' => 'Enforce 2FA for all admin accounts',          'enabled' => true,  'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        // 4. Create audit_logs table (only if not already created by another migration)
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('action', 30);        // create | update | delete | auth | export | view
                $table->string('entity_type', 60);   // user | vendor | order | product | etc.
                $table->string('entity_id', 100)->nullable();
                $table->text('details')->nullable();
                $table->uuid('performed_by')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index(['action', 'entity_type']);
                $table->index('performed_by');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('audit_logs');
    }
};
