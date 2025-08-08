<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


abstract class ThConceptBase extends Model
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
    
    abstract public function getBroadersCountAttribute();
    abstract public function labels();
    abstract public function notes();
    abstract public function narrowers();
    abstract public function broaders();
    abstract public static function getLabelClass();
    abstract public static function getBroaderClass();
    
    /**
     * Get the number of relations this concept has. This is the cound of all broaders and wheather it's a top concept. 
     *
     * @return string
     */
    public function relationsCount(){
        $count = $this->broaders()->count();
        if($this->is_top_concept) {
            $count++;
        }
        return $count; 
    }

    public function addLabel(User $user, string $label, int $languageId, bool $quietly = false): ThConceptLabelBase {
        $ThLabelClass = static::getLabelClass();
        $thConceptLabel = new $ThLabelClass();
        $thConceptLabel->label = $label;
        $thConceptLabel->concept_id = $this->id;
        $thConceptLabel->language_id = $languageId;
        $thConceptLabel->user_id = $user->id;
        // Do not fire event, because it is part of ThConcept event
        
        if($quietly) {
            $thConceptLabel->saveQuietly();
        } else {
            $thConceptLabel->save();
        }
        return $thConceptLabel;
    }

    public function addBroader($broaderId, bool $quietly = false): ?ThBroaderBase {
        $ThBroaderClass = static::getBroaderClass();
        return $ThBroaderClass::add($broaderId, $this->id, $quietly);
    }

    public static function create(User $user, string $label, int $languageId, ?int $parentId, bool $isTopConcept = false, bool $quietly = false): ThConceptBase {
        $instance = new static();
        $instance->concept_url = static::generateConceptUrl($user, $label);
        $instance->concept_scheme = 'no scheme';
        $instance->is_top_concept = $isTopConcept;
        $instance->user_id = $user->id;
        
        if($quietly){
            $instance->saveQuietly();
        }else {
            $instance->save();
        }
        
        if(!$isTopConcept) {
            $ThBroaderClass = static::getBroaderClass();
            $thBroader = new $ThBroaderClass();
            $thBroader->broader_id = $parentId;
            $thBroader->narrower_id = $instance->id;
            // Do not fire event, because it is part of ThConcept event
            $thBroader->saveQuietly();
        }
        
        $instance->addLabel($user, $label, $languageId, true);
        return $instance;
    }

    public static function generateConceptUrl(User $user,string $label): string {
        $slugLabel = Str::slug($label);
        $projectName = Preference::getUserPreference($user->id, 'prefs.project-name');
        if(isset($projectName['value'])) {
            $projectName = $projectName['value'];
        } else {
            $projectName = 'default';
        }
        $slugProjectName = Str::slug($projectName);
        $ts = date("YmdHis");

        return "https://spacialist.escience.uni-tuebingen.de/$slugProjectName/$slugLabel#$ts";
    }
    
    
    /**
     * Returns an array of concepts that match a given label.
     */
    public static function getByLabel(string $label, ?string $langCode = null): array {
        $query = self::with(['labels.language' => function($query) use($langCode) {
            if($langCode) {
                $query->where('short_name', $langCode);
            }
        }])
        ->whereHas('labels', function($query) use($label) {
            $query->where('label', 'LIKE', "%$label%");
        });

        return $query->get()->all();
    }
}
