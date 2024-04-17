<?php

namespace App;

class ThConceptSandbox extends ThConceptBase
{
    protected $table = 'th_concept_master';
    protected $broader = ThBroaderSandbox::class;
    protected $appends = ['broaders_count'];


    public function getBroadersCountAttribute() {
        return $this->broaders()->count();
    }

    public function labels() {
        return $this->hasMany('App\ThConceptLabelSandbox', 'concept_id');
    }

    public function notes() {
        return $this->hasMany('App\ThConceptNoteSandbox', 'concept_id');
    }

    public function narrowers() {
        return $this->belongsToMany('App\ThConceptSandbox', 'th_broaders_master', 'broader_id', 'narrower_id');
    }

    public function broaders() {
        return $this->belongsToMany('App\ThConceptSandbox', 'th_broaders_master', 'narrower_id', 'broader_id');
    }
}
