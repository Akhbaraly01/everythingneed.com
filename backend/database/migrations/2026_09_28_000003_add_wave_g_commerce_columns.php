<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Wave G (spec Phases 7+8): canonical catalog slugs (§9), vendor settings
 * (§34), cart variants + server tax (§33), extended order workflow statuses
 * (§32) with restore points for returns/disputes, and delivery metadata
 * (§61 - estimated delivery window + proof of delivery).
 */
return new class extends Migration
{
    public function up(): void
    {
        // §9 - canonical slug URLs for products, vendors and deals (need_items).
        foreach (['products' => 'name', 'vendors' => 'store_name', 'need_items' => 'name'] as $table => $source) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->string('slug')->nullable()->unique();
            });

            $this->backfillSlugs($table, $source);
        }

        // §34 - vendor settings bag (accepting orders, public contact).
        Schema::table('vendors', function (Blueprint $blueprint): void {
            $blueprint->json('settings')->nullable();
        });

        // §33 - cart lines can carry a variant; orders carry server tax.
        Schema::table('cart_items', function (Blueprint $blueprint): void {
            $blueprint->uuid('product_variant_id')->nullable();
            $blueprint->string('variant_name')->nullable();
            $blueprint->foreign('product_variant_id')
                ->references('id')->on('product_variants')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $blueprint): void {
            $blueprint->decimal('tax', 12, 2)->default(0);
        });

        // §32 - the spec order workflow: pending, paid, confirmed, processing,
        // shipped, delivered, completed + cancelled, returned, refund requested,
        // refunded, disputed. Existing rows are a subset, so the widened check
        // constraint is always satisfiable.
        DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
        DB::statement(
            "ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ("
            . "'pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'completed',"
            . " 'cancelled', 'returned', 'refund_requested', 'refunded', 'disputed'"
            . '))'
        );

        // Restore points: a return/dispute remembers the status it interrupted
        // so closing it puts the order back exactly where it was.
        Schema::table('return_requests', function (Blueprint $blueprint): void {
            $blueprint->string('previous_status')->nullable();
        });
        Schema::table('disputes', function (Blueprint $blueprint): void {
            $blueprint->string('previous_status')->nullable();
        });

        // §61 - delivery providers publish an ETA window; delivered orders can
        // attach proof of delivery.
        Schema::table('shipping_rates', function (Blueprint $blueprint): void {
            $blueprint->unsignedInteger('estimated_days')->nullable();
        });
        Schema::table('order_tracking', function (Blueprint $blueprint): void {
            $blueprint->string('proof_of_delivery')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('order_tracking', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('proof_of_delivery');
        });
        Schema::table('shipping_rates', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('estimated_days');
        });
        Schema::table('disputes', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('previous_status');
        });
        Schema::table('return_requests', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('previous_status');
        });

        DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
        DB::statement(
            "ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ("
            . "'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'"
            . '))'
        );

        Schema::table('orders', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('tax');
        });
        Schema::table('cart_items', function (Blueprint $blueprint): void {
            if (Schema::hasColumn('cart_items', 'product_variant_id')) {
                $blueprint->dropForeign(['product_variant_id']);
            }
            $blueprint->dropColumn(['product_variant_id', 'variant_name']);
        });
        Schema::table('vendors', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('settings');
        });

        foreach (['products', 'vendors', 'need_items'] as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                if (Schema::hasColumn($table, 'slug')) {
                    $blueprint->dropUnique([$table . '_slug_unique']);
                    $blueprint->dropColumn('slug');
                }
            });
        }
    }

    /**
     * Unique slug per row: slugified source value, numeric suffixes on
     * collision, 'item' when the source slugs to nothing.
     */
    private function backfillSlugs(string $table, string $source): void
    {
        $rows = DB::table($table)->select('id', $source)->orderBy('created_at')->get();
        $used = [];

        foreach ($rows as $row) {
            $base = Str::slug((string) ($row->{$source} ?? '')) ?: 'item';
            $slug = $base;
            $suffix = 2;

            while (isset($used[$slug]) || DB::table($table)->where('slug', $slug)->exists()) {
                $slug = $base . '-' . $suffix++;
            }

            $used[$slug] = true;
            DB::table($table)->where('id', $row->id)->update(['slug' => $slug]);
        }
    }
};
