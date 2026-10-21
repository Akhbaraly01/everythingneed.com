<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A listing created through the admin console is a platform listing: it is
 * not owned by the acting admin (the admin would otherwise become the
 * customer-facing owner and viewer-request handler of every console
 * listing). It is attributed to the vendor account the admin owns, and
 * stays unowned when there is no vendor - so the owner column has to
 * accept NULL. The foreign key to users is untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE properties ALTER COLUMN user_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE properties ALTER COLUMN user_id SET NOT NULL');
    }
};
