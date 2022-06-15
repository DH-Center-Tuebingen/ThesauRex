<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ThConcept extends Model
{
    protected $table = 'th_concept';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'concept_url',
        'concept_scheme',
        'user_id',
    ];

    // protected $appends = ['parents', 'path'];

    public static function getMap() {
        $lang = 'de'; // TODO
        $concepts = DB::select(DB::raw("
            WITH summary AS
            (
                SELECT th_concept.id, concept_url, is_top_concept, label, language_id, th_language.short_name,
                ROW_NUMBER() OVER
                (
                    PARTITION BY th_concept.id
                    ORDER BY th_concept.id, short_name != '$lang', concept_label_type
                ) AS rk
                FROM th_concept
                JOIN th_concept_label ON th_concept_label.concept_id = th_concept.id
                JOIN th_language ON language_id = th_language.id
            )
            SELECT id, concept_url, is_top_concept, label, language_id, short_name
            FROM summary s
            WHERE s.rk = 1"));

        $conceptMap = [];

        foreach ($concepts as $concept) {
            $url = $concept->concept_url;
            unset($concept->concept_url);
            $conceptMap[$url] = $concept;
        }

        return $conceptMap;
    }

    public static function getChildren($url, $recursive = true) {
        $id = self::where('concept_url', $url)->value('id');
        if(!isset($id)) return [];

        $query = "SELECT br.broader_id, br.narrower_id, c.*
        FROM th_broaders br
        JOIN th_concept as c on c.id = br.narrower_id
        WHERE broader_id = $id";

        if($recursive) {
            $query = "
                WITH RECURSIVE
                top AS (
                    $query
                    UNION
                    SELECT br.broader_id, br.narrower_id, c2.*
                    FROM top t, th_broaders br
                    JOIN th_concept as c2 on c2.id = br.narrower_id
                    WHERE t.narrower_id = br.broader_id
                )
                SELECT *
                FROM top
            ";
        }
        return DB::select($query);
    }

    public function labels() {
        return $this->hasMany('App\ThConceptLabel', 'concept_id');
    }

    public function notes() {
        return $this->hasMany('App\ThConceptNote', 'concept_id');
    }

    public function narrowers() {
        return $this->belongsToMany('App\ThConcept', 'th_broaders', 'broader_id', 'narrower_id');
    }

    public function broaders() {
        return $this->belongsToMany('App\ThConcept', 'th_broaders', 'narrower_id', 'broader_id');
    }

    public function parentIds() {
        $parents = [];

        // add empty path for root concepts
        if($this->is_top_concept) {
            $parents[] = [];
        }

        $broaders = ThBroader::select('broader_id')
            ->where('narrower_id', $this->id)
            ->get();

        foreach($broaders as $broader) {
            $parentBroaders = ThConcept::find($broader->broader_id)->parentIds();
            foreach($parentBroaders as $pB) {
                $parents[] = array_merge($pB, [$broader->broader_id]);
            }
        }

        return $parents;
    }

    public function getParentsAttribute() {
        $user = auth()->user();
        $langCode = $user->getLanguage();

        $parents = [];
        foreach($this->parentIds() as $paths) {
            $path = [];
            foreach($paths as $pid) {
                $parent = ThConcept::with(['labels.language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name != '$langCode'");
                }])
                ->where('id', $pid)
                ->first();
                $path[] = $parent;
            }
            $parents[] = $path;
        }

        return $parents;
    }

    public function getPathAttribute() {
        $paths = [];
        foreach($this->parentIds() as $idPath) {
            $idPath[] = $this->id;
            $paths[] = array_reverse($idPath);
        }

        return $paths;
    }
}
