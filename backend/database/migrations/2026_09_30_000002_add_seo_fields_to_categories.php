<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            if (!Schema::hasColumn('categories', 'meta_title')) {
                $table->string('meta_title', 255)->nullable()->after('description');
            }
            if (!Schema::hasColumn('categories', 'meta_description')) {
                $table->string('meta_description', 500)->nullable()->after('meta_title');
            }
            if (!Schema::hasColumn('categories', 'meta_keywords')) {
                $table->string('meta_keywords', 255)->nullable()->after('meta_description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table): void {
            foreach (['meta_title', 'meta_description', 'meta_keywords'] as $column) {
                if (Schema::hasColumn('categories', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
