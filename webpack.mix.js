const mix = require('laravel-mix');
const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin')

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

mix.js('resources/js/app.js', 'public/js').vue()
   .sass('resources/sass/app.scss', 'public/css')
//    .copy(
//        'node_modules/vue-multiselect/dist/vue-multiselect.min.css',
//        'public/css'
//    )
   .options({
       fileLoaderDirs: {
           fonts: appPath + 'fonts'
       }
   })
   .webpackConfig(webpack => {
       return {
            output: {
                publicPath: '/' + appPath
            },
            stats: {
                children: true
            },
            // plugins: [
            //     new CircularDependencyPlugin({
            //         // exclude detection of files based on a RegExp
            //         exclude: /node_modules/,
            //         // include specific files based on a RegExp
            //         include: /resources/,
            //         // add errors to webpack instead of warnings
            //         failOnError: true,
            //         // allow import cycles that include an asyncronous import,
            //         // e.g. via import(/* webpackMode: "weak" */ './file.js')
            //         allowAsyncCycles: false,
            //         // set the current working directory for displaying module paths
            //         cwd: process.cwd(),
            //     })
            // ]
       }
   })
   .sourceMaps()
   .extract();

if(`public/${appPath}fonts` !== 'public/fonts') {
    mix.copyDirectory(`public/${appPath}fonts`, 'public/fonts');
}
mix.alias({
    '@': path.join(__dirname, 'resources/js')
});
