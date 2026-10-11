<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave F (spec S12/S14): server-controlled transition history for need
 * requests - powers the detail timeline and the my-needs tracking page.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_request_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_request_id');
            $table->uuid('actor_id')->nullable();
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->string('action', 32);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['need_request_id', 'created_at']);
            $table->foreign('need_request_id')->references('id')->on('need_requests')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_request_events');
    }
};
