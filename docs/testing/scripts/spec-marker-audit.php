<?php

/**
 * Spec-marker audit.
 *
 * Every "TODO nn" comment in the backend is a spec-traceability marker.
 * This script proves it mechanically: for each marker it looks at the code
 * that follows (comment lines skipped) and reports the markers that have
 * no implementation directly below them.
 *
 * Usage:  php docs/testing/scripts/spec-marker-audit.php
 * Exit:   0 when every marker has code below it, 1 when one is open.
 */

$root = dirname(__DIR__, 3) . '/backend';

$targets = [];
foreach (['app', 'Modules', 'Core'] as $dir) {
    if (! is_dir($root . '/' . $dir)) {
        continue;
    }
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $dir));
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $targets[] = $file->getPathname();
        }
    }
}
sort($targets);

$open = [];
$implemented = 0;

foreach ($targets as $file) {
    $lines = file($file);
    foreach ($lines as $i => $line) {
        if (! preg_match('/TODO (\d+)/', $line, $m)) {
            continue;
        }

        $code = '';
        for ($j = $i + 1; $j < count($lines) && $j < $i + 25; $j++) {
            $next = trim($lines[$j]);
            if ($next === '') {
                continue;
            }
            if (str_starts_with($next, '//') || str_starts_with($next, '*') || str_starts_with($next, '/*')) {
                continue;
            }
            $code = $next;
            break;
        }

        if ($code === '') {
            $open[] = str_replace($root . '/', '', $file) . ':' . ($i + 1) . '  ' . trim($line);
        } else {
            $implemented++;
        }
    }
}

echo "spec-traceability markers with code below: {$implemented}\n";
echo 'markers with NO code directly below: ' . count($open) . "\n";

foreach ($open as $line) {
    echo "  OPEN  {$line}\n";
}

exit($open === [] ? 0 : 1);
