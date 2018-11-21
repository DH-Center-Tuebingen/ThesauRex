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
        $prefs = $systemPrefs;
        foreach($userPrefs as $p) {
            $prefs[] = $p;
        }
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

    public static function hasPublicAccess() {
        $value = self::where('label', 'prefs.project-maintainer')->value('default_value');
        $decodedValue = json_decode($value);
        return Helpers::parseBoolean($decodedValue->public);
    }

    public static function decodePreference($label, $value) {
        switch($label) {
            case 'prefs.gui-language':
                return $value->language_key;
            case 'prefs.columns':
                return $value;
            case 'prefs.show-tooltips':
                return $value->show;
            case 'prefs.tag-root':
                return $value->uri;
            case 'prefs.load-extensions':
                return $value;
            case 'prefs.link-to-thesaurex':
                return $value->url;
            case 'prefs.project-name':
                return $value->name;
            case 'prefs.project-maintainer':
                return $value;
            case 'prefs.map-projection':
                $proj4 = \DB::table('spatial_ref_sys')
                    ->where('auth_srid', $value->epsg)
                    ->value('proj4text');
                return [
                    'epsg' => $value->epsg,
                    'proj4' => $proj4
                ];
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
