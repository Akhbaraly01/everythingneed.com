<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cms_blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content')->nullable();
            $table->string('author')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cms_banners', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('position')->default('homepage');
            $table->string('image_url')->nullable();
            $table->string('link_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cms_announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->longText('content')->nullable();
            $table->string('priority')->default('medium');
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('subject');
            $table->longText('description')->nullable();
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->uuid('assigned_to')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('vendor_withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
        });

        Schema::create('vendor_commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('vendor_id');
            $table->uuid('order_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->decimal('rate', 5, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_commissions');
        Schema::dropIfExists('vendor_withdrawals');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('cms_announcements');
        Schema::dropIfExists('cms_banners');
        Schema::dropIfExists('cms_blog_posts');
        Schema::dropIfExists('cms_pages');
    }
};
