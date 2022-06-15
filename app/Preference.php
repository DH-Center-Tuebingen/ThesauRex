<?php

namespace App;

use App\UserPreference;
use Illuminate\Database\Eloquent\Model;

class Preference extends Model
{
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
    ];

    public static function getPreferences() {
        $prefs = self::orderBy('id')->get();
        $prefObj = self::decodePreferences($prefs);
        return $prefObj;
    }

    public static function getUserPreferences($id) {
        $userPrefs = UserPreference::select('user_preferences.*', 'preferences.*', 'value as default_value')
            ->join('preferences', 'user_preferences.pref_id', 'preferences.id')
            ->where('user_id', $id)
            ->get();
        $systemPrefs = self::whereNotIn('id', $userPrefs->pluck('pref_id')->toArray())
            ->get();
        $prefs = $systemPrefs->merge($userPrefs);
        $prefObj = self::decodePreferences($prefs);
        return $prefObj;
    }

    public static function getUserPreference($uid, $label) {
        $pref = self::where('label', $label)
            ->join('user_preferences', 'pref_id', 'preferences.id')
            ->where('user_id', $uid)
            ->first();
        if(!isset($pref)) {
            $pref = self::where('label', $label)->first();
            $pref->value = $pref->default_value;
            unset($pref->default_value);
        }
        $pref->value = self::decodePreference($pref->label, json_decode($pref->value));
        return $pref;
    }

    public static function decodePreference($label, $value) {
        switch($label) {
            case 'prefs.gui-language':
                return $value->language_key;
            case 'prefs.enable-password-reset-link':
                return $value->use;
            case 'prefs.project-name':
                return $value->name;
            case 'prefs.link-to-spacialist':
                return $value->url;
            case 'prefs.import-config':
                return $value;
        }
        return $value;
    }

    public static function encodePreference($label, $decodedValue) {
        $value;
        switch($label) {
            case 'prefs.gui-language':
                $value = json_encode(['language_key' => $decodedValue]);
                break;
            case 'prefs.enable-password-reset-link':
                $value = json_encode(['use' => $decodedValue]);
                break;
            case 'prefs.project-name':
                $value = json_encode(['name' => $decodedValue]);
                break;
            case 'prefs.link-to-spacialist':
                $value = json_encode(['url' => $decodedValue]);
                break;
            case 'prefs.import-config':
                $value = $decodedValue;
                break;
        }
        return $value;
    }

    private static function decodePreferences($prefs) {
        $prefObj = [];
        foreach($prefs as $p) {
            $decoded = json_decode($p->default_value);
            unset($p->default_value);
            $p->value = self::decodePreference($p->label, $decoded);
            $prefObj[$p->label] = $p;
        }
        return $prefObj;
    }
}
