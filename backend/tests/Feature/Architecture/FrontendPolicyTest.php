<?php

namespace Tests\Feature\Architecture;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Static policy gates for the reference-admin extraction (P7) and the
 * token-only footer rewrite (P8):
 *  - no native prompt()/confirm() dialogs anywhere in the Inertia frontend;
 *  - no hard-coded amber-* utility classes in the marketplace footer.
 *
 * W0: the legacy duplicate SPA (frontend/) was removed as a second
 * system. Its footer assertion now lives solely on the canonical
 * backend marketplace footer (test below), so coverage is unchanged.
 */
class FrontendPolicyTest extends TestCase
{
    private function jsFiles(): array
    {
        $root = resource_path('js');
        $files = [];
        $it = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($it as $file) {
            if ($file->isFile() && in_array($file->getExtension(), ['ts', 'tsx'], true)) {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    private function stripComments(string $code): string
    {
        $code = preg_replace('#/\*.*?\*/#s', '', $code);
        $lines = preg_split('/\R/', $code) ?: [];
        $kept = array_filter($lines, fn (string $line) => !preg_match('/^\s*(\/\/|\*)/', $line));

        return implode("\n", $kept);
    }

    #[Test]
    public function no_native_prompt_or_confirm_dialogs_remain_in_the_frontend(): void
    {
        $offenders = [];
        foreach ($this->jsFiles() as $path) {
            $code = $this->stripComments((string) file_get_contents($path));
            if (preg_match('/(?<![\w.])(window\.)?(prompt|confirm)\s*\(/', $code, $m, PREG_OFFSET_CAPTURE)) {
                $line = substr_count(substr($code, 0, $m[0][1]), "\n") + 1;
                $offenders[] = str_replace(resource_path('js'), '', $path).':'.$line;
            }
        }

        $this->assertSame([], $offenders, 'Native dialogs must be replaced by shared Ui components: '.implode(', ', $offenders));
    }

    #[Test]
    public function backend_marketplace_footer_is_free_of_hard_coded_amber_classes(): void
    {
        $path = resource_path('js/components/Marketplace/Footer.tsx');
        $this->assertFileExists($path);
        $contents = (string) file_get_contents($path);

        $this->assertStringNotContainsString('amber-', $contents, 'Footer must use design tokens only.');
    }
}
