<?php

namespace App\Http\Controllers;
use App\Preference;
use App\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PreferenceController extends Controller {
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct() {
        //
    }

    // GET
    public function getPreferences() {
        $preferences = Preference::getPreferences();
        return response()->json($preferences);
    }

    public function getUserPreferences($id) {
        $user = auth()->user();
        if(!isset($user) || $user->id != $id) {
            return response()->json([
                'error' => __('You are not allowed to access preferences of another user')
            ], 403);
        }
        $preferences = Preference::getUserPreferences($id);
        return response()->json($preferences);
    }

    // POST

    // PATCH
    public function patchPreference(Request $request, $id) {
        $this->validate($request, [
            'label' => 'required|string|exists:preferences,label',
            'value' => 'nullable',
            'user_id' => 'nullable|integer|exists:users,id',
            'allow_override' => 'nullable|boolean_string'
        ]);

        $user = auth()->user();
        $uid = $request->get('user_id');
        if(!$user->can('edit_preferences') && !isset($uid)) {
            return response()->json([
                'error' => __('You do not have the permission to edit preferences')
            ], 403);
        }

        $label = $request->get('label');
        $value = $request->get('value');
        $allowOverride = $request->get('allow_override');

        try {
            $pref = Preference::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This preference does not exist')
            ], 400);
        }

        $encodedValue = $this->encodePreference($label, $value);

        if(isset($uid)) {
            $userPref = UserPreference::where('pref_id', $id)->where('user_id', $uid)->first();
            // if this preference doesn't exist for the desired user: create it
            if($userPref == null) {
                $userPref = new UserPreference();
                $userPref->pref_id = $id;
                $userPref->user_id = $uid;
            }
            $userPref->value = $encodedValue;
            $userPref->save();
        } else {
            $pref->default_value = $encodedValue;
            if(isset($allowOverride)) {
                $allowOverride = sp_parse_boolean($allowOverride);
                $removeUserPrefs = $pref->allow_override && !$allowOverride;
                $pref->allow_override = $allowOverride;
                // remove stored user prefs, if pref is no longer overridable
                if($removeUserPrefs) {
                    UserPreference::where('pref_id', $id)->delete();
                }
            }
            $pref->save();
            return response()->json(null, 204);
        }
    }

    // PUT

    // DELETE

    // OTHER FUNCTIONS
    private function encodePreference($label, $decodedValue) {
        $value;
        switch($label) {
            case 'prefs.gui-language':
                $value = json_encode(['language_key' => $decodedValue]);
                break;
            case 'prefs.columns':
                $value = $decodedValue;
                break;
            case 'prefs.show-tooltips':
                $value = json_encode(['show' => $decodedValue]);
                break;
            case 'prefs.tag-root':
                $value = json_encode(['uri' => $decodedValue]);
                break;
            case 'prefs.load-extensions':
                $value = $decodedValue;
                break;
            case 'prefs.link-to-thesaurex':
                $value = json_encode(['url' => $decodedValue]);
                break;
            case 'prefs.project-name':
                $value = json_encode(['name' => $decodedValue]);
                break;
            case 'prefs.project-maintainer':
                $value = $decodedValue;
                break;
            case 'prefs.map-projection':
                $value = $decodedValue;
                break;
        }
        return $value;
    }
}
