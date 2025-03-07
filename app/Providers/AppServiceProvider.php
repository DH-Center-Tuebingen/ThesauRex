<?php

namespace App\Providers;

use App\Preference;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
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
