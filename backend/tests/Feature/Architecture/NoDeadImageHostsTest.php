<?php

namespace Tests\Feature\Architecture;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W1: no shipped source may reference dead external image hosts or faker's
 * imageUrl() (which emits those hosts). Demo imagery is local only:
 * /placeholder.svg, /storage/seed/*, library uploads.
 *
 * Exempt by name (they are the repair machinery, not producers):
 *  - ProductImageSeeder: matches dead hosts to rewrite them;
 *  - CmsSeeder: rewrites the one known dead block URL;
 *  - this file: states the banned pattern.
 */
class NoDeadImageHostsTest extends TestCase
{
    private const EXEMPT = ['ProductImageSeeder.php', 'CmsSeeder.php', 'NoDeadImageHostsTest.php'];

    #[Test]
    public function no_dead_image_hosts_or_faker_image_urls_in_sources(): void
    {
        $roots = [
            database_path('factories'),
            database_path('seeders'),
            resource_path('js'),
        ];
        $pattern = '/via\.placeholder\.com|placehold\.it|placehold\.co|dummyimage\.com|->imageUrl\(/';

        $offenders = [];
        foreach ($roots as $root) {
            $it = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
            );
            foreach ($it as $file) {
                if (! $file->isFile()) {
                    continue;
                }
                if (in_array($file->getBasename(), self::EXEMPT, true)) {
                    continue;
                }
                $ext = $file->getExtension();
                if (! in_array($ext, ['php', 'ts', 'tsx'], true)) {
                    continue;
                }
                $contents = (string) file_get_contents($file->getPathname());
                if (preg_match($pattern, $contents)) {
                    $offenders[] = $file->getPathname();
                }
            }
        }

        $this->assertSame(
            [],
            $offenders,
            'Dead external image hosts must not ship. Use /placeholder.svg or the media library: '.implode(', ', $offenders)
        );
    }
}
