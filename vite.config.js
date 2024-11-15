import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const isOpen = process.env.IS_OPEN === 'true';
const buildDir = isOpen ? 'build_open' : 'build';

const _dirname = dirname(fileURLToPath(import.meta.url));

export default ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const config = {
        plugins: [
            laravel({
                input: [
                    'resources/js/app.js',
                    'resources/sass/app.scss',
                ],
                refresh: true, // Ensure HMR is enabled
            }),
            vue({
                template: {
                    transformAssetUrls: {
                        // The Vue plugin will re-write asset URLs, when referenced
                        // in Single File Components, to point to the Laravel web
                        // server. Setting this to `null` allows the Laravel plugin
                        // to instead re-write asset URLs to point to the Vite
                        // server instead.
                        base: null,

                        // The Vue plugin will parse absolute URLs and treat them
                        // as absolute paths to files on disk. Setting this to
                        // `false` will leave absolute URLs un-touched so they can
                        // reference assets in the public directory as expected.
                        includeAbsolute: false
                    },
                },
            }),
        ],
        build: {
            manifest: isOpen ? 'manifest.open.json' : 'manifest.json',
            outDir: `public/${buildDir}`,
            sourcemap: true,
        },
        resolve: {
            alias: {
                '@': resolve(_dirname, './resources/js/'),
                '~': resolve(_dirname, './node_modules/'),
                '!': resolve(_dirname, './public/'),
                '%store': resolve(_dirname, './resources/js/bootstrap/store.js'),
                '%router': resolve(_dirname, './resources/js/bootstrap/router.js'),
            },
        }, 
        server: {
            host: 'localhost',
            port: 3000, // Ensure this port is not conflicting with other services
            watch: {
                usePolling: true, // Use polling if file changes are not detected
            },
        },
    };

    if(env.VITE_APP_PATH) {
        config.base = `${env.VITE_APP_PATH.replace(/\/$/, '')}/${buildDir}/`;
    }

    return defineConfig(config);
};