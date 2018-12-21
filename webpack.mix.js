const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | App Path
 |--------------------------------------------------------------------------
 |
 | The relative path of your app in your web browser's root folder
 | **without** leading and **with** trailing slash
 |
 |--------------------------------------------------------------------------
 | Example
 |--------------------------------------------------------------------------
 |
 | Document Root: /var/www/html
 | App Root: /var/www/html/spacialist/instance1
 | => appPath = 'spacialist/instance1/'
 |
 */

const appPath = process.env.MIX_APP_PATH;

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('resources/js/app.js', 'public/js')
   .sass('resources/sass/app.scss', 'public/css')
   .copy(
       'node_modules/vue-multiselect/dist/vue-multiselect.min.css',
       'public/css'
   )
   .options({
       fileLoaderDirs: {
           fonts: appPath + 'fonts'
       }
   })
   .webpackConfig({
      output: {
         publicPath: '/' + appPath
      }
   })
   .autoload({
       jquery: ['$'],
       axios: ['$http']
   })
   .extract([
       '@fortawesome/fontawesome-svg-core',
       '@fortawesome/free-brands-svg-icons',
       '@fortawesome/free-regular-svg-icons',
       '@fortawesome/free-solid-svg-icons',
       '@websanova/vue-auth',
       'axios',
       'bootstrap',
       'country-emoji',
       'debounce',
       'jquery',
       'lodash',
       'moment',
       'p-queue',
       'popper.js',
       'transliteration',
       'tree-vue-component',
       'v-tooltip',
       'vee-validate',
       'vue',
       'vue-i18n',
       'vue-context',
       'vue-infinite-scroll',
       'vue-js-modal',
       'vue-multiselect',
       'vue-notification',
       'vue-router',
       'vue-typeahead',
       'vue-upload-component',
       'vuedraggable'
   ]);
