<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TODO 07 lifecycle: idempotent submission (client_key scoped per owner) so
 * retried POSTs return the original row instead of duplicating it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->uuid('client_key')->nullable()->index();
            $table->unique(['user_id', 'client_key'], 'need_requests_owner_client_key_unique');
        });
    }

    public function down(): void
    {
        Schema::table('need_requests', function (Blueprint $table) {
            $table->dropUnique('need_requests_owner_client_key_unique');
            $table->dropColumn('client_key');
        });
    }
};
