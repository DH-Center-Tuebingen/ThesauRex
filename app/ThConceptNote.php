<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptNote extends Model
{
    protected $table = 'th_concept_notes';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'content',
        'concept_id',
        'language_id',
    ];

    public function concept() {
        return $this->belongsTo('App\ThConcept', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
