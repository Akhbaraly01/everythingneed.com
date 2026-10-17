<?php

namespace App\Console\Commands;

use Core\Services\Contracts\NotificationServiceInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Needs\Services\SavedSearchMatcher;

/**
 * N-31 saved-search alerts: the scheduler walks every saved search whose
 * alert_cursor has moved past (or is unset for the first run after a grace
 * period), finds public requests created since the cursor that match the
 * stored query, and sends one digest notification per search. The cursor
 * only advances when at least one match was found (or when the search has
 * never been seen and we are just seeding the cursor), so a failed notify
 * never swallows the batch.
 *
 * First run: if alert_cursor is null AND last_alerted_at is null, we seed
 * the cursor to "now" without notifying (the provider did not ask to be
 * spammed with historical requests when the feature ships).
 */
class AlertSavedSearches extends Command
{
    protected $signature = 'needs:alert-saved-searches {--dry-run : Report what would be alerted without sending}';

    protected $description = 'Notify providers about new public requests matching their saved searches';

    public function handle(SavedSearchMatcher $matcher, NotificationServiceInterface $notify): int
    {
        $dry = (bool) $this->option('dry-run');
        $now = now();

        $rows = DB::table('need_saved_items')
            ->where('item_type', 'search')
            ->whereNotNull('query')
            ->orderBy('created_at')
            ->get();

        $alerted = 0;
        $seeded = 0;

        foreach ($rows as $row) {
            $query = json_decode($row->query, true);
            if (! is_array($query) || $query === []) {
                continue;
            }

            // First-seen searches: seed the cursor without notifying so the
            // feature ship does not spam historical matches.
            if ($row->alert_cursor === null && $row->last_alerted_at === null) {
                if (! $dry) {
                    DB::table('need_saved_items')->where('id', $row->id)->update([
                        'alert_cursor' => $now->toIso8601String(),
                        'last_alerted_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
                $seeded++;
                continue;
            }

            $matches = $matcher->match($query, $row->alert_cursor, $row->user_id);

            if ($matches === []) {
                continue;
            }

            $titles = array_map(fn ($m) => $m->title, $matches);
            $preview = implode(', ', array_slice($titles, 0, 3));
            $more = count($matches) - 3;
            $message = count($matches) === 1
                ? "New request matching your saved search: {$titles[0]}"
                : count($matches)." new requests match your saved search: {$preview}".($more > 0 ? " (+{$more} more)" : '');

            if (! $dry) {
                $notify->notify(
                    (string) $row->user_id,
                    'Saved search alert',
                    $message,
                    'saved_search',
                    $row->id,
                );

                DB::table('need_saved_items')->where('id', $row->id)->update([
                    'alert_cursor' => $now->toIso8601String(),
                    'last_alerted_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $alerted++;
            $this->line("  [{$row->user_id}] ".count($matches)." match(es): {$preview}");
        }

        $this->info(($dry ? '[dry-run] ' : '')."Alerted {$alerted} search(es); seeded {$seeded} new search(es).");

        return self::SUCCESS;
    }
}