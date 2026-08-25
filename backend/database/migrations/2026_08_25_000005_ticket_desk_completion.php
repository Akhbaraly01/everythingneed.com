<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Satisfaction + escalation state live on the ticket itself.
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'satisfaction_rating')) {
                $table->unsignedTinyInteger('satisfaction_rating')->nullable();
            }
            if (!Schema::hasColumn('tickets', 'satisfaction_comment')) {
                $table->string('satisfaction_comment', 1000)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable();
            }
        });

        // Complete audit history of everything that happens to a ticket.
        if (!Schema::hasTable('ticket_events')) {
            Schema::create('ticket_events', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('ticket_id')->index();
                $table->uuid('actor_id')->nullable();
                $table->string('event_type', 40);   // created|replied|status_changed|department_transferred|escalated|rated|closed|reopened
                $table->json('payload')->nullable(); // from→to, reason, rating…
                $table->timestamp('created_at');

                $table->index(['ticket_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_events');

        Schema::table('tickets', function (Blueprint $table) {
            foreach (['satisfaction_rating', 'satisfaction_comment', 'escalated_at'] as $col) {
                if (Schema::hasColumn('tickets', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
