import { mkdirSync, cpSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/@ffmpeg/core/dist/umd');
const destination = resolve(root, 'public/build/ffmpeg');

if (!existsSync(source)) {
    console.warn('[ffmpeg-core] @ffmpeg/core not installed - video compression falls back to original uploads.');
    process.exit(0);
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('[ffmpeg-core] core assets copied to public/build/ffmpeg');
