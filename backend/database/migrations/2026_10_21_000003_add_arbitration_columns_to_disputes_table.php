<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-21 arbitration on a needs dispute.
 *
 * A dispute raised against an escrowed milestone is arbitrated by a
 * moderator: the held amount is split between a provider award and a
 * buyer refund, and both legs are recorded against the dispute.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('disputes', 'arbitration_status')) {
            return;
        }

        Schema::table('disputes', function (Blueprint $table) {
            $table->uuid('need_milestone_id')->nullable()->index();
            $table->string('arbitration_status', 20)->nullable()->index();
            $table->decimal('provider_award', 12, 2)->nullable();
            $table->decimal('buyer_refund', 12, 2)->nullable();
            $table->uuid('arbitrated_by')->nullable();
            $table->timestamp('arbitrated_at')->nullable();
            $table->text('arbitration_notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            $table->dropColumn([
                'need_milestone_id',
                'arbitration_status',
                'provider_award',
                'buyer_refund',
                'arbitrated_by',
                'arbitrated_at',
                'arbitration_notes',
            ]);
        });
    }
};
