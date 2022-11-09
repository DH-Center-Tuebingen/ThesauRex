<?php

use App\Preference;
use App\ThBroader;
use App\ThBroaderSandbox;
use App\ThConcept;
use App\ThConceptSandbox;
use App\ThConceptLabel;
use App\ThConceptLabelSandbox;
use App\ThConceptNote;
use App\ThConceptNoteSandbox;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

if(!function_exists('th_is_part_of_spacialist')) {
    function th_is_part_of_spacialist() {
        if(!Schema::hasTable('migrations')) {
            return false;
        }

        return DB::table('migrations')
            ->where('migration', '2018_09_06_092028_setup_tables')
            ->exists()
            &&
            DB::table('migrations')
            ->where('migration', '2019_10_15_100721_create_permission_tables')
            ->exists();
    }
}

if(!function_exists('th_get_permission_groups')) {
    function th_get_permission_groups($onlyGroups = false) {
        $corePermissionPath = base_path("storage/framework/App/core-permissions.json");
        if(!File::isFile($corePermissionPath)) {
            return [];
        }
        $permissionSets = json_decode(file_get_contents($corePermissionPath), true);

        if($onlyGroups) {
            return array_keys($permissionSets);
        } else {
            return $permissionSets;
        }
    }
}

if(!function_exists('sp_parse_boolean')) {
    function sp_parse_boolean($str) {
        $acceptable = [true, 1, '1', 'true', 'TRUE'];
        return in_array($str, $acceptable, true);
    }
}

if(!function_exists('sp_get_public_url')) {
    function sp_get_public_url($filename) {
        if(!Auth::check()) return "";

        if(th_is_part_of_spacialist() && !Storage::exists($filename)) {
            $uid = Auth::user()->id;
            $pref = Preference::getUserPreference($uid, "prefs.link-to-spacialist");
            $path = Str::finish($pref->value, "/");
            return "${path}storage/$filename";
        }
        return Storage::url($filename);
    }
}

if(!function_exists('is_part_of_spacialist')) {
    function is_part_of_spacialist() {
        if(!Schema::hasTable('migrations')) {
            return false;
        }
        return \DB::table('migrations')
            ->where('migration', '2018_09_06_092028_setup_tables')
            ->exists();
    }
}

// detail level
// 0 = no relations
// 1 = labels
// 2 = all
if(!function_exists('th_tree_builder')) {
    function th_tree_builder($name, $langCode = null, $detailLevel = 2) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptSandbox::query();
        } else {
            $builder = ThConcept::query();
        }
        if($detailLevel === 0 || $langCode === null) {
            return $builder;
        } else {
            $labelWith = [
                'labels.language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name != '$langCode'");
                }
            ];
            $detailedWith = [];
            if($detailLevel == 2) {
                $detailedWith = [
                    'notes.language' => function($query) use($langCode) {
                        $query->orderByRaw("short_name != '$langCode'");
                    },
                    'narrowers.labels',
                    'broaders.labels'
                ];
            }
            $withs = array_merge($labelWith, $detailedWith);
            return $builder->with($withs);
        }
    }
}

if(!function_exists('th_broader_builder')) {
    function th_broader_builder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThBroaderSandbox::query();
        } else {
            $builder = ThBroader::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name != '$langCode'");
                }]);
        }
    }
}

if(!function_exists('th_label_builder')) {
    function th_label_builder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptLabelSandbox::query();
        } else {
            $builder = ThConceptLabel::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name != '$langCode'");
                }]);
        }
    }
}

if(!function_exists('th_note_builder')) {
    function th_note_builder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptNoteSandbox::query();
        } else {
            $builder = ThConceptNote::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name != '$langCode'");
                }]);
        }
    }
}

if(!function_exists('th_detect_circles')) {
    function th_detect_circles() {
        $circles = \DB::select(\DB::raw("
            WITH RECURSIVE
            cte(bid, nid, depth, path, is_cycle) AS (
                SELECT b.broader_id, b.narrower_id, 1, ARRAY[b.broader_id], false
                FROM th_broaders b
              UNION ALL
                SELECT b.broader_id, b.narrower_id, cte.depth + 1, path || b.broader_id, b.broader_id = ANY(path)
                FROM th_broaders b, cte
                WHERE b.broader_id = cte.nid AND NOT is_cycle
            )
            SELECT distinct bid
            FROM cte
            WHERE is_cycle = TRUE
        "));

        return $circles;
    }
}
