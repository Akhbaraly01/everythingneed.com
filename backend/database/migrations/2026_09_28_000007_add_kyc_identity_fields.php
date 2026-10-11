<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave I (spec 28 KYC): identity information on top of the document row,
 * explicit resubmission counting and a verified timestamp. Stored status
 * vocabulary is unchanged (pending/submitted/approved/rejected +
 * requires_action); spec states are derived in Core\Support\KycStatus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kyc_verifications', function (Blueprint $blueprint): void {
            $blueprint->string('full_name')->nullable();
            $blueprint->date('date_of_birth')->nullable();
            $blueprint->string('nationality', 3)->nullable();
            $blueprint->text('address')->nullable();
            $blueprint->date('id_expiry_date')->nullable();
            $blueprint->unsignedInteger('attempts')->default(0);
            $blueprint->timestamp('verified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('kyc_verifications', function (Blueprint $blueprint): void {
            $blueprint->dropColumn([
                'full_name',
                'date_of_birth',
                'nationality',
                'address',
                'id_expiry_date',
                'attempts',
                'verified_at',
            ]);
        });
    }
};
