<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Modules\Admin\Entities\MediaItem;

/**
 * W1: media-library backfill. Files that reached the public disk without a
 * media_library row (older uploads, seed copies, manual drops) get an
 * auditable row so the admin library, picker and delete flows see them.
 * Idempotent: existing rows (matched by path) are never duplicated.
 */
class BackfillMediaOrphans extends Command
{
    protected $signature = 'media:backfill-orphans {--disk=public : Disk to scan} {--dry-run : Report only, create nothing}';

    protected $description = 'Register public-disk files missing a media_library row';

    public function handle(): int
    {
        $disk = (string) $this->option('disk');
        $dryRun = (bool) $this->option('dry-run');

        $known = MediaItem::where('disk', $disk)->pluck('path')->all();
        $known = array_flip($known);

        $registered = 0;
        $skipped = 0;

        foreach (Storage::disk($disk)->allFiles() as $path) {
            if (basename($path) === '.gitignore') {
                continue;
            }
            if (isset($known[$path])) {
                $skipped++;
                continue;
            }

            $mime = Storage::disk($disk)->mimeType($path) ?: 'application/octet-stream';
            $width = null;
            $height = null;
            if (str_starts_with($mime, 'image/')) {
                try {
                    $dims = @getimagesize(Storage::disk($disk)->path($path)) ?: null;
                    $width = $dims[0] ?? null;
                    $height = $dims[1] ?? null;
                } catch (\Throwable) {
                    $width = null;
                    $height = null;
                }
            }

            if (! $dryRun) {
                MediaItem::create([
                    'title' => substr(pathinfo($path, PATHINFO_FILENAME), 0, 250),
                    'file_name' => substr(basename($path), 0, 255),
                    'disk' => $disk,
                    'path' => $path,
                    'mime_type' => $mime,
                    'size' => (int) Storage::disk($disk)->size($path),
                    'width' => $width,
                    'height' => $height,
                    'owner_type' => null,
                    'owner_id' => null,
                    'meta' => ['scope' => 'backfill'],
                ]);
            }

            $registered++;
        }

        $mode = $dryRun ? '[dry-run] ' : '';
        $this->info("{$mode}Registered {$registered} orphan file(s); {$skipped} already known.");

        return self::SUCCESS;
    }
}
