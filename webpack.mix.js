const mix = require('laravel-mix');

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
   .webpackConfig({
      output: {
         publicPath: '/'
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
