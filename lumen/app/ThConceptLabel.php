<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptLabel extends Model
{
    protected $table = 'th_concept_label';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'concept_id',
        'language_id',
        'lasteditor',
        'label',
        'concept_label_type',
    ];
}
