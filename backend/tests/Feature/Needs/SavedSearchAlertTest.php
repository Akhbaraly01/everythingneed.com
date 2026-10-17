<?php

namespace Tests\Feature\Needs;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * N-31 saved-search alerts: the scheduler notifies providers about new
 * public requests matching their saved searches. First-run seeding never
 * spams history; the cursor only advances on a real match; dry-run reports
 * without sending.
 */
class SavedSearchAlertTest extends TestCase
{
    use RefreshDatabase;

    private function category(): NeedCategory
    {
        return NeedCategory::create([
            'name' => 'Cleaning',
            'slug' => 'cleaning-'.uniqid(),
            'icon' => 'sparkles',
            'color' => '#10B981',
            'is_active' => true,
        ]);
    }

    private function publicRequest(object $owner, NeedCategory $cat, string $title = 'Deep clean needed'): string
    {
        return NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $cat->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => $title,
            'description' => 'Full deep clean.',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'visibility' => NeedRequest::VISIBILITY_PUBLIC,
        ])->id;
    }

    private function savedSearch(object $user, array $query, ?string $cursor = null, ?string $lastAlerted = null): string
    {
        $id = (string) \Illuminate\Support\Str::uuid();
        DB::table('need_saved_items')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'item_type' => 'search',
            'item_id' => null,
            'query' => json_encode($query),
            'alert_cursor' => $cursor,
            'last_alerted_at' => $lastAlerted,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    public function test_first_run_seeds_cursor_without_notifying(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cat = $this->category();
        $this->publicRequest($owner, $cat);

        $savedId = $this->savedSearch($provider, ['category_id' => $cat->id]);

        Artisan::call('needs:alert-saved-searches');

        // No notification for historical matches on first run.
        $this->assertSame(0, DB::table('notifications')->where('user_id', $provider->id)->count());
        $row = DB::table('need_saved_items')->where('id', $savedId)->first();
        $this->assertNotNull($row->alert_cursor);
        $this->assertNotNull($row->last_alerted_at);
    }

    public function test_new_match_after_cursor_fires_one_notification(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cat = $this->category();

        $savedId = $this->savedSearch($provider, ['category_id' => $cat->id], now()->subHour()->toIso8601String(), now()->subHour());

        // A new public request after the cursor.
        $this->publicRequest($owner, $cat, 'Urgent deep clean');

        Artisan::call('needs:alert-saved-searches');

        $notes = DB::table('notifications')->where('user_id', $provider->id)->get();
        $this->assertCount(1, $notes);
        $this->assertSame('Saved search alert', $notes[0]->title);
        $this->assertStringContainsString('Urgent deep clean', $notes[0]->message);

        $row = DB::table('need_saved_items')->where('id', $savedId)->first();
        $this->assertNotNull($row->last_alerted_at);

        // Second run: cursor advanced, no duplicate alert.
        Artisan::call('needs:alert-saved-searches');
        $this->assertSame(1, DB::table('notifications')->where('user_id', $provider->id)->count());
    }

    public function test_non_matching_request_is_not_alerted(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cleanCat = $this->category();
        $plumbCat = $this->category();

        $this->savedSearch($provider, ['category_id' => $cleanCat->id], now()->subHour()->toIso8601String(), now()->subHour());

        // A request in a different category.
        $this->publicRequest($owner, $plumbCat, 'Fix leaky pipe');

        Artisan::call('needs:alert-saved-searches');

        $this->assertSame(0, DB::table('notifications')->where('user_id', $provider->id)->count());
    }

    public function test_dry_run_reports_without_sending(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cat = $this->category();

        $savedId = $this->savedSearch($provider, ['category_id' => $cat->id], now()->subHour()->toIso8601String(), now()->subHour());
        $this->publicRequest($owner, $cat, 'Deep clean');

        $before = DB::table('need_saved_items')->where('id', $savedId)->first();

        Artisan::call('needs:alert-saved-searches', ['--dry-run' => true]);

        $this->assertSame(0, DB::table('notifications')->where('user_id', $provider->id)->count());
        $row = DB::table('need_saved_items')->where('id', $savedId)->first();
        $this->assertSame($before->alert_cursor, $row->alert_cursor);
        $this->assertSame($before->last_alerted_at, $row->last_alerted_at);
    }

    public function test_text_query_matches_title_and_description(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cat = $this->category();

        $this->savedSearch($provider, ['q' => 'windows'], now()->subHour()->toIso8601String(), now()->subHour());

        $this->publicRequest($owner, $cat, 'Office cleaning including windows');
        $this->publicRequest($owner, $cat, 'Kitchen deep clean');

        Artisan::call('needs:alert-saved-searches');

        $notes = DB::table('notifications')->where('user_id', $provider->id)->get();
        $this->assertCount(1, $notes);
        $this->assertStringContainsString('windows', $notes[0]->message);
        $this->assertStringNotContainsString('Kitchen', $notes[0]->message);
    }

    public function test_visibility_scoping_prevents_invite_only_leaks(): void
    {
        $provider = $this->createUser();
        $owner = $this->createUser();
        $cat = $this->category();

        $this->savedSearch($provider, ['category_id' => $cat->id], now()->subHour()->toIso8601String(), now()->subHour());

        // Invite-only request must not leak into saved-search alerts.
        NeedRequest::create([
            'user_id' => $owner->id,
            'category_id' => $cat->id,
            'request_number' => 'NR-'.strtoupper(uniqid()),
            'title' => 'Private invite-only job',
            'description' => 'Secret.',
            'status' => NeedRequest::STATUS_PUBLISHED,
            'visibility' => NeedRequest::VISIBILITY_INVITE_ONLY,
            'invited_provider_ids' => json_encode([(string) \Illuminate\Support\Str::uuid()]),
        ]);

        Artisan::call('needs:alert-saved-searches');

        $this->assertSame(0, DB::table('notifications')->where('user_id', $provider->id)->count());
    }
}