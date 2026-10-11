import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                // W17 (F-02): split the long-lived vendor runtime from app code
                // so deploys keep the react/vendor cache warm.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
                    if (id.includes('@inertiajs')) return 'inertia';
                    return 'vendor';
                },
            },
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@components': path.resolve(__dirname, './resources/js/components'),
            '@layouts': path.resolve(__dirname, './resources/js/layouts'),
            '@pages': path.resolve(__dirname, './resources/js/pages'),
            '@hooks': path.resolve(__dirname, './resources/js/hooks'),
            '@lib': path.resolve(__dirname, './resources/js/lib'),
            '@types': path.resolve(__dirname, './resources/js/types'),
            '@core': path.resolve(__dirname, './resources/js/core'),
        },
    },
});
