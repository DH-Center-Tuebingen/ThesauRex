<?php

namespace App;

class ThConceptNoteSandbox extends ThConceptNoteBase
{
    protected $table = 'th_concept_notes_master';

    public function concept() {
        return $this->belongsTo('App\ThConceptSandbox', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
