<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptBase extends Model
{
    protected $table;
    protected $broader;
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'concept_url',
        'concept_scheme',
        'is_top_concept',
        'user_id',
    ];

    public function parentIds() {
        $parents = [];

        // add empty path for root concepts
        if($this->is_top_concept) {
            $parents[] = [];
        }

        $broaders = $this->broader::select('broader_id')
            ->where('narrower_id', $this->id)
            ->get();

        foreach($broaders as $broader) {
            $parentBroaders = self::find($broader->broader_id)->parentIds();
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
                $parent = self::with(['labels.language' => function($query) use($langCode) {
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
