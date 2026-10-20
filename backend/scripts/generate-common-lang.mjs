/**
 * One-shot migration tool (multilingual Phase 0).
 *
 * Reads the legacy frontend dictionaries in resources/js/lib/i18n-dict.ts
 * and writes them out as authoritative Laravel lang files:
 *
 *   lang/{locale}/common.php   (nested arrays from the dotted keys)
 *
 * Run from the backend directory BEFORE rewriting i18n-dict.ts:
 *
 *   node scripts/generate-common-lang.mjs
 *
 * It is intentionally not part of the build: after the frontend moved to
 * i18next + i18n:export, lang/ is the source of truth and this script has
 * no more input to read. Re-running against the rewritten i18n-dict.ts
 * fails loudly with that explanation.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, '..');
const dictPath = join(backendRoot, 'resources/js/lib/i18n-dict.ts');
const langRoot = join(backendRoot, 'lang');

const source = readFileSync(dictPath, 'utf8');

const enBlockStart = source.indexOf('const en: Dict = {');
if (enBlockStart === -1) {
    console.error(
        'Could not find the English dictionary block in i18n-dict.ts.\n' +
        'This one-shot tool only works against the pre-i18next version of ' +
        'the file; lang/ is the source of truth now.',
    );
    process.exit(1);
}

const enBlockEnd = source.indexOf('\n};', enBlockStart);
if (enBlockEnd === -1) {
    console.error('Could not find the end of the English dictionary block.');
    process.exit(1);
}

const enBlock = source.slice(enBlockStart, enBlockEnd);
const keyPattern = /^\s{4}'([^']+)':/gm;
const keys = [];
for (const match of enBlock.matchAll(keyPattern)) {
    keys.push(match[1]);
}

if (keys.length === 0) {
    console.error('No keys extracted from the English dictionary block.');
    process.exit(1);
}

const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;

const moduleShim = { exports: {} };
new Function('module', 'exports', compiled)(moduleShim, moduleShim.exports);

const { LANGUAGES, translate } = moduleShim.exports;
if (!Array.isArray(LANGUAGES) || typeof translate !== 'function') {
    console.error('i18n-dict.ts no longer exports LANGUAGES/translate as expected.');
    process.exit(1);
}

function phpString(value) {
    return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function emitTree(tree, indent) {
    const pad = '    '.repeat(indent);
    const lines = [];

    for (const [key, value] of Object.entries(tree)) {
        if (value !== null && typeof value === 'object') {
            lines.push(`${pad}${phpString(key)} => [`);
            lines.push(...emitTree(value, indent + 1));
            lines.push(`${pad}],`);
        } else {
            lines.push(`${pad}${phpString(key)} => ${phpString(String(value))},`);
        }
    }

    return lines;
}

for (const language of LANGUAGES) {
    const tree = {};

    for (const key of keys) {
        const value = translate(language, key);

        if (typeof value !== 'string' || value === '') {
            console.error(`Empty translation for ${language}:${key}`);
            process.exit(1);
        }

        const segments = key.split('.');
        let node = tree;
        for (let i = 0; i < segments.length - 1; i += 1) {
            const segment = segments[i];
            if (node[segment] === undefined) {
                node[segment] = {};
            }
            if (typeof node[segment] !== 'object') {
                console.error(`Key conflict at ${key} (segment "${segment}" already a string).`);
                process.exit(1);
            }
            node = node[segment];
        }

        const leaf = segments[segments.length - 1];
        if (typeof node[leaf] === 'object') {
            console.error(`Key conflict at ${key} (leaf already a subtree).`);
            process.exit(1);
        }
        node[leaf] = value;
    }

    const header = [
        '<?php',
        '',
        '/**',
        ` * ${language} translations for the global storefront chrome (common namespace).`,
        ' *',
        ' * Migrated one-shot from the legacy resources/js/lib/i18n-dict.ts',
        ' * (multilingual Phase 0). This file is the source of truth now: edit it',
        ' * here and run `php artisan i18n:export` so the frontend bundles update.',
        ' *',
        ' * Coverage rule: every locale carries every key; the runtime falls back',
        ' * to the fallback locale (en) for anything missing, never to a raw key.',
        ' */',
        '',
        'return [',
    ];

    const body = emitTree(tree, 1);
    const content = [...header, ...body, '];', ''].join('\n');

    const target = join(langRoot, language, 'common.php');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
    console.log(`wrote lang/${language}/common.php (${keys.length} keys)`);
}
