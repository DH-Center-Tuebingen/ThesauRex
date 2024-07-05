<?php

namespace App\Http\Controllers;
use App\Preference;
use App\User;
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
        $user = auth()->user();
        if(!$user->can('preferences_read')) {
            return response()->json([
                'error' => __('You are not allowed to read preferences')
            ], 403);
        }

        $preferences = Preference::getPreferences();
        return response()->json($preferences);
    }

    public function getUserPreferences($id) {
        $user = auth()->user();
        if(!isset($user) || ($user->id != $id && !$user->can('preferences_write'))) {
            return response()->json([
                'error' => __('You are not allowed to access preferences of another user')
            ], 403);
        }

        try {
            User::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        $preferences = Preference::getUserPreferences($id);
        return response()->json($preferences);
    }

    // POST

    // PATCH
    public function patchPreferences(Request $request, $uid = -1) {
        $user = auth()->user();
        $isUserPref = $uid > 0;

        // If user who tries to set preferences is not supplied uid,
        // check if they are allowed to set preferences of other users
        if($isUserPref && $user->id !== $uid && !$user->can('preferences_write')) {
            return response()->json([
                'error' => __('You do not have the permission to edit preferences of another user')
            ], 403);
        } else if(!$isUserPref && !$user->can('preferences_write')) {
            return response()->json([
                'error' => __('You do not have the permission to edit system preferences')
            ], 403);
        }
        // When try to set preferences of user, check for existence first
        if($isUserPref) {
            try {
                User::findOrFail($uid);
            } catch (ModelNotFoundException $e) {
                return response()->json([
                    'error' => __('This user does not exist')
                ], 400);
            }
        }

        $this->validate($request, [
            'changes' => 'required|array',
        ]);

        $changes = $request->get('changes');

        foreach($changes as $c) {
            $label = $c['label'];
            $value = $c['value'];

            try {
                $pref = Preference::where('label', $label)->firstOrFail();
            } catch(ModelNotFoundException $e) {
                return response()->json([
                    'error' => __('This preference does not exist')
                ], 400);
            }
            $encodedValue = Preference::encodePreference($label, $value);

            if($isUserPref) {
                $userPref = UserPreference::where('pref_id', $pref->id)
                    ->where('user_id', $uid)
                    ->first();
                // if this preference doesn't exist for the desired user: create it
                if(!isset($userPref)) {
                    $userPref = new UserPreference();
                    $userPref->pref_id = $pref->id;
                    $userPref->user_id = $uid;
                }
                $userPref->value = $encodedValue;
                $userPref->save();
            } else {
                $pref->default_value = $encodedValue;
                $allowOverride = $c['allow_override'] ?? false;
                if($allowOverride === true || $allowOverride === false) {
                    $removeUserPrefs = $pref->allow_override && !$allowOverride;
                    $pref->allow_override = $allowOverride;
                    // remove stored user prefs, if pref is no longer overridable
                    if($removeUserPrefs) {
                        UserPreference::where('pref_id', $pref->id)->delete();
                    }
                }
                $pref->save();
            }
        }

        return response()->json(null, 204);
    }

    // PUT

    // DELETE
}
