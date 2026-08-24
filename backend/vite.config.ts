import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
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
    ssr: {
        noExternal: ['@radix-ui/*'],
    },
});
