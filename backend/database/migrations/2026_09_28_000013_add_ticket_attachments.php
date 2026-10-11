<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave O (spec 62 SUPPORT): ticket + message attachments (paths produced
 * by the uploader, never raw client strings).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $blueprint): void {
            $blueprint->json('attachments')->nullable();
        });

        Schema::table('ticket_messages', function (Blueprint $blueprint): void {
            $blueprint->json('attachments')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('ticket_messages', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('attachments');
        });

        Schema::table('tickets', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('attachments');
        });
    }
};
