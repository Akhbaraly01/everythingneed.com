import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const jsRoot = path.resolve(dirname, './resources/js');

// Unit-test runner (W4). Mirrors the vite.config.ts aliases so tests
// import app code through the same `@/...` paths the app uses.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': jsRoot,
            '@components': path.resolve(jsRoot, './components'),
            '@layouts': path.resolve(jsRoot, './layouts'),
            '@pages': path.resolve(jsRoot, './pages'),
            '@hooks': path.resolve(jsRoot, './hooks'),
            '@lib': path.resolve(jsRoot, './lib'),
            '@types': path.resolve(jsRoot, './types'),
            '@core': path.resolve(jsRoot, './core'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./resources/js/test/setup.ts'],
        include: ['resources/js/**/*.test.{ts,tsx}'],
        restoreMocks: true,
        css: false,
    },
});
