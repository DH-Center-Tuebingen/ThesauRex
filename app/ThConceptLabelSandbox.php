<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptLabelSandbox extends Model
{
    protected $table = 'th_concept_label_master';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'concept_id',
        'language_id',
        'user_id',
        'label',
        'concept_label_type',
    ];

    public function concept() {
        return $this->belongsTo('App\ThConceptSandbox', 'concept_id');
    }

    public function language() {
        return $this->belongsTo('App\ThLanguage', 'language_id');
    }
}
