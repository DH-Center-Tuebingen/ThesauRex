<?php

namespace App;

class ThConceptLabelSandbox extends ThConceptLabelBase
{
    protected $table = 'th_concept_label_master';

    public function concept() {
        return $this->belongsTo('App\ThConceptSandbox', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
