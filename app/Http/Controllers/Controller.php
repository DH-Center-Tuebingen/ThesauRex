<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\View;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    public function __construct() {
        // $preferences = Preference::all();
        // $preferenceValues = [];
        // foreach($preferences as $p) {
        //     $preferenceValues[$p->label] = Preference::decodePreference($p->label, json_decode($p->default_value));
        // }

        $preferenceValues = [
            'prefs.project-name' => 'Demo'
        ];

        View::share('p', $preferenceValues);
  }
}
