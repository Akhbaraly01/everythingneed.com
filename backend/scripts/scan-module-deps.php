<?php

// One-shot: emits the grandfathered cross-module dependency allowlist for
// ModuleDependencyTest. Entities<->Entities (ORM relations) and Events
// (sanctioned channel) are always allowed and excluded here.
// Run: php scripts/scan-module-deps.php --allowlist

$modulesDir = __DIR__ . '/../Modules';
$direct = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($modulesDir, FilesystemIterator::SKIP_DOTS)
);

foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }
    $path = $file->getPathname();
    $relative = str_replace('\\', '/', substr($path, strlen(dirname($modulesDir)) + 1));
    $parts = explode('/', $relative);
    $module = $parts[1] ?? '';
    $inEntities = ($parts[2] ?? '') === 'Entities';
    $code = (string) file_get_contents($path);

    if (!preg_match_all('/Modules\\\\([A-Za-z0-9_]+)\\\\([A-Za-z0-9_]+)/', $code, $matches, PREG_SET_ORDER)) {
        continue;
    }

    $seen = [];
    foreach ($matches as $match) {
        [, $other, $layer] = $match;
        if ($other === $module) {
            continue;
        }
        if ($layer === 'Events') {
            continue;
        }
        if ($inEntities && $layer === 'Entities') {
            continue;
        }
        $key = "{$relative} => Modules\\{$other}\\{$layer}";
        $seen[$key] = true;
    }
    foreach ($seen as $key => $_) {
        $direct[$key] = true;
    }
}

ksort($direct);

if (in_array('--allowlist', $argv ?? [], true)) {
    $grouped = [];
    foreach (array_keys($direct) as $key) {
        [$file, $ref] = explode(' => ', $key, 2);
        $grouped[$file][] = $ref;
    }
    echo "    private const ALLOWLIST = [\n";
    foreach ($grouped as $file => $refs) {
        $quoted = implode("', '", array_unique($refs));
        echo "        '{$file}' => ['{$quoted}'],\n";
    }
    echo "    ];\n";
    echo "// files: " . count($grouped) . "\n";
    exit(0);
}

echo "=== DIRECT LAYER ACCESS: " . count($direct) . " ===\n";
echo implode("\n", array_keys($direct)) . "\n";
