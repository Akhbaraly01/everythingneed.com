<?php

// One-shot: list mutating routes without an explicit throttle middleware.
// Run: php scripts/scan-throttle-gaps.php
// Note: global limiters (240/min IP, 60/min api) still backstop everything;
// explicit per-route throttles are the tightened second layer.

$roots = [__DIR__ . '/../routes', __DIR__ . '/../Modules'];
$files = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($roots[0], FilesystemIterator::SKIP_DOTS)
);

$targets = [];
foreach ($roots as $root) {
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($it as $file) {
        if (!$file->isFile() || !in_array($file->getFilename(), ['web.php', 'api.php'], true)) {
            continue;
        }
        $targets[] = $file->getPathname();
    }
}
sort($targets);

$gaps = [];
foreach ($targets as $path) {
    $lines = file($path, FILE_IGNORE_NEW_LINES);
    $relative = str_replace('\\', '/', substr($path, strlen(dirname(__DIR__)) + 1));
    $buffer = '';
    $start = 0;
    foreach ($lines as $i => $line) {
        $buffer .= "\n" . $line;
        // A Route::verb(...) statement ends at the first line ending with ';'
        // at statement depth — approximate by semicolon-terminated chunks.
        if (str_contains($line, ';')) {
            if (preg_match('/Route::(post|put|patch|delete)\s*\(\s*([^,]+),/i', $buffer, $m)) {
                $hasThrottle = stripos($buffer, 'throttle:') !== false;
                if (!$hasThrottle) {
                    $gaps[] = sprintf('%s:%d %s %s', $relative, $start + 1, strtoupper($m[1]), trim($m[2], '\'" '));
                }
            }
            $buffer = '';
            $start = $i + 1;
        }
    }
}

echo 'MUTATING ROUTES WITHOUT EXPLICIT THROTTLE: ' . count($gaps) . "\n";
echo implode("\n", $gaps) . "\n";
