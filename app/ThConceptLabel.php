<?php

namespace App;

class ThConceptLabel extends ThConceptLabelBase
{
    protected $table = 'th_concept_label';

    public function concept() {
        return $this->belongsTo('App\ThConcept', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
