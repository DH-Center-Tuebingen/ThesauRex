<?php

namespace App;

class ThConceptNote extends ThConceptNoteBase
{
    protected $table = 'th_concept_notes';

    public function concept() {
        return $this->belongsTo('App\ThConcept', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
