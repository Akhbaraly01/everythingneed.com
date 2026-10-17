<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * N-24 workroom: shared files per engaged request. Metadata only — the
 * bytes sit on the private disk under workrooms/{request}/{uuid}, and
 * no URL column exists by design (signed URLs are minted on demand).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('need_files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('need_request_id')->index();
            $table->uuid('uploader_id')->index();
            $table->string('original_name', 255);
            $table->string('disk', 20)->default('local');
            $table->string('path', 500);
            $table->unsignedBigInteger('size')->nullable();
            $table->string('mime', 127)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('need_files');
    }
};
