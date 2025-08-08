<?php

namespace App\Providers;

use App\Preference;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // In some Proxy setups it might be necessary to enforce using the app's url as root url
        if(env('APP_FORCE_URL') === true) {
            $rootUrl = config('app.url');
            URL::forceRootUrl($rootUrl);
            if(Str::startsWith($rootUrl, 'https://')) {
                URL::forceScheme('https');
            }
        }

        View::composer('*', function($view) {
            $preferences = Preference::all();
            $preferenceValues = [];
            foreach($preferences as $p) {
                $preferenceValues[$p->label] = Preference::decodePreference($p->label, json_decode($p->default_value));
            }

            $view->with('p', $preferenceValues);
        });

        Validator::extend('boolean_string', function ($attribute, $value, $parameters, $validator) {
            $acceptable = [true, false, 0, 1, '0', '1', 'true', 'false', 'TRUE', 'FALSE'];
            return in_array($value, $acceptable, true);
        });
        Validator::extend('upload_type', function ($attribute, $value, $parameters, $validator) {
            return in_array($value, \App\Http\Controllers\TreeController::importTypes);
        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
