<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Preference;
use App\ThConcept;
use App\User;
use Illuminate\Support\Facades\App;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
        // $this->middleware('auth');
    }

    public function getGlobalData() {
        if(auth()->check()) {
            $preferences = Preference::getUserPreferences(auth()->id());
            $preferenceValues = [];
            foreach($preferences as $k => $p) {
                $preferenceValues[$k] = $p->value;
            }
        } else {
            $preferenceValues = [];
        }

        $sysPrefs = Preference::getPreferences();

        return response()->json([
            'standalone' => !th_is_part_of_spacialist(),
            'system_preferences' => $sysPrefs,
            'preferences' => $preferenceValues,
        ]);
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('home');
    }
}
