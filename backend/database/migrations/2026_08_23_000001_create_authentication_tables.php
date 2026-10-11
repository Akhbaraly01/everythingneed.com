<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('otp_challenges')) {
            Schema::create('otp_challenges', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->nullable()->index();
                $table->string('phone', 30)->index();
                $table->string('code');
                $table->timestamp('expires_at');
                $table->unsignedInteger('attempts')->default(0);
                $table->boolean('verified')->default(false);
                $table->timestamps();

                $table->foreign('user_id')
                    ->references('id')->on('users')
                    ->nullOnDelete();
            });
        }

        if (!Schema::hasTable('two_factor_secrets')) {
            Schema::create('two_factor_secrets', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('user_id')->index();
                $table->text('secret');
                $table->boolean('enabled')->default(false);
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->unique('user_id');

                $table->foreign('user_id')
                    ->references('id')->on('users')
                    ->cascadeOnDelete();
            });
        } elseif (!Schema::hasColumn('two_factor_secrets', 'deleted_at')) {
            Schema::table('two_factor_secrets', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('two_factor_secrets');
        Schema::dropIfExists('otp_challenges');
    }
};
