<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('service_type');
            $table->uuid('service_id')->nullable();
            $table->json('details')->default('{}');
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->index('user_id');
            $table->index('service_type');
        });

        Schema::create('expert_availability', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('expert_id');
            $table->string('expert_type');
            $table->string('current_status')->nullable();
            $table->boolean('is_available')->default(true);
            $table->string('status_message')->nullable();
            $table->timestamp('next_available_at')->nullable();
            $table->timestamps();
        });

        Schema::create('expert_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('expert_id');
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->index('expert_id');
        });

        Schema::create('expert_wishlists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('expert_id');
            $table->unique(['user_id', 'expert_id']);
        });

        Schema::create('service_workers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('worker_type');
            $table->text('bio')->nullable();
            $table->string('avatar_url')->nullable();
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->integer('experience_years')->nullable();
            $table->integer('completed_jobs')->default(0);
            $table->boolean('is_available')->default(true);
            $table->decimal('rating', 3, 1)->nullable();
            $table->timestamps();
            $table->index('worker_type');
            $table->index('is_available');
        });

        Schema::create('building_service_bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('worker_type');
            $table->string('service_category');
            $table->text('description');
            $table->string('address');
            $table->date('scheduled_date');
            $table->time('scheduled_time')->nullable();
            $table->decimal('estimated_cost', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('delivery_managers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('vehicle_type')->nullable();
            $table->boolean('is_available')->default(true);
            $table->integer('completed_deliveries')->default(0);
            $table->decimal('rating', 3, 1)->nullable();
            $table->timestamps();
        });

        Schema::create('need_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon');
            $table->string('color');
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('need_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('category_id')->constrained('need_categories')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->uuid('vendor_id')->nullable();
            $table->timestamps();
            $table->index('category_id');
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'product_id']);
        });

        Schema::create('user_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->json('value')->nullable();
            $table->unique(['user_id', 'key']);
        });

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->boolean('default_value')->default(false);
            $table->json('conditions')->nullable();
            $table->timestamps();
        });

        Schema::create('analytics_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_type');
            $table->string('entity_type')->nullable();
            $table->uuid('entity_id')->nullable();
            $table->uuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('properties')->nullable();
            $table->string('session_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at');
            $table->index('event_type');
            $table->index('user_id');
            $table->index('created_at');
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type');
            $table->uuid('entity_id');
            $table->unique(['user_id', 'entity_type', 'entity_id']);
        });

        Schema::create('recently_viewed', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type');
            $table->uuid('entity_id');
            $table->timestamp('viewed_at');
            $table->index(['user_id', 'entity_type', 'entity_id']);
        });

        Schema::create('stock_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->uuid('warehouse_id')->nullable();
            $table->integer('quantity')->default(0);
            $table->integer('reserved_quantity')->default(0);
            $table->integer('reorder_point')->default(0);
            $table->unique(['product_id', 'warehouse_id']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->integer('quantity');
            $table->string('reference_type')->nullable();
            $table->uuid('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('product_id');
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('coupon_code')->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cart_items_v2', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cart_id')->constrained()->cascadeOnDelete();
            $table->uuid('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->index('cart_id');
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('restaurants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('cuisine_type');
            $table->string('address');
            $table->string('city');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('phone')->nullable();
            $table->string('image_url')->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('opening_hours')->nullable();
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category');
            $table->string('image_url')->nullable();
            $table->boolean('is_available')->default(true);
            $table->boolean('is_vegetarian')->default(false);
            $table->boolean('is_vegan')->default(false);
            $table->integer('spice_level')->default(0);
            $table->timestamps();
            $table->index('restaurant_id');
        });

        Schema::create('food_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->text('delivery_address');
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])->default('pending');
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->timestamp('estimated_delivery_time')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('food_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->constrained('food_orders')->cascadeOnDelete();
            $table->uuid('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->text('special_instructions')->nullable();
            $table->index('order_id');
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone');
            $table->string('license_number')->unique();
            $table->string('vehicle_type');
            $table->boolean('is_available')->default(true);
            $table->decimal('rating', 3, 1)->nullable();
            $table->integer('total_rides')->default(0);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('driver_id')->constrained()->cascadeOnDelete();
            $table->string('make');
            $table->string('model');
            $table->integer('year');
            $table->string('color');
            $table->string('license_plate')->unique();
            $table->string('vehicle_type');
        });

        Schema::create('rides', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('driver_id')->nullable()->constrained()->nullOnDelete();
            $table->string('pickup_address');
            $table->decimal('pickup_lat', 10, 7);
            $table->decimal('pickup_lng', 10, 7);
            $table->string('dropoff_address');
            $table->decimal('dropoff_lat', 10, 7);
            $table->decimal('dropoff_lng', 10, 7);
            $table->enum('status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'])->default('requested');
            $table->decimal('fare', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('driver_id');
            $table->index('status');
        });

        Schema::create('hotels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address');
            $table->string('city');
            $table->string('state')->nullable();
            $table->string('country');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->integer('star_rating')->nullable();
            $table->string('image_url')->nullable();
            $table->json('amenities')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('hotel_rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('hotel_id')->constrained()->cascadeOnDelete();
            $table->string('room_type');
            $table->decimal('price_per_night', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->integer('capacity');
            $table->json('amenities')->nullable();
            $table->boolean('is_available')->default(true);
            $table->string('image_url')->nullable();
            $table->timestamps();
            $table->index('hotel_id');
        });

        Schema::create('hotel_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('hotel_id')->constrained()->cascadeOnDelete();
            $table->uuid('room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->integer('guests');
            $table->decimal('total_amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->text('special_requests')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('properties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('property_type');
            $table->decimal('price', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->decimal('area_sqft', 10, 2)->nullable();
            $table->string('address');
            $table->string('city');
            $table->string('state')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('country');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('images')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('job_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('company');
            $table->string('location');
            $table->string('job_type');
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->json('requirements')->nullable();
            $table->json('benefits')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('job_post_id')->constrained()->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('resume_url')->nullable();
            $table->text('cover_letter')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'])->default('pending');
            $table->timestamps();
            $table->index('job_post_id');
            $table->index('user_id');
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->string('icon')->nullable();
            $table->string('image_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('reviewable_type');
            $table->uuid('reviewable_id');
            $table->integer('rating');
            $table->string('title')->nullable();
            $table->text('comment')->nullable();
            $table->boolean('is_verified_purchase')->default(false);
            $table->integer('helpful_count')->default(0);
            $table->timestamps();
            $table->index(['reviewable_type', 'reviewable_id']);
            $table->index('user_id');
        });

        Schema::create('review_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('review_id')->constrained()->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_helpful');
            $table->unique(['review_id', 'user_id']);
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('interval');
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('plan_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['active', 'cancelled', 'expired', 'paused'])->default('active');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('status');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('subscription_id')->constrained()->cascadeOnDelete();
            $table->uuid('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index('subscription_id');
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('review_votes');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_posts');
        Schema::dropIfExists('properties');
        Schema::dropIfExists('hotel_reservations');
        Schema::dropIfExists('hotel_rooms');
        Schema::dropIfExists('hotels');
        Schema::dropIfExists('rides');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('food_order_items');
        Schema::dropIfExists('food_orders');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('restaurants');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('cart_items_v2');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stock_levels');
        Schema::dropIfExists('recently_viewed');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('analytics_events');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('need_items');
        Schema::dropIfExists('need_categories');
        Schema::dropIfExists('delivery_managers');
        Schema::dropIfExists('building_service_bookings');
        Schema::dropIfExists('service_workers');
        Schema::dropIfExists('expert_wishlists');
        Schema::dropIfExists('expert_reviews');
        Schema::dropIfExists('expert_availability');
        Schema::dropIfExists('bookings');
    }
};
