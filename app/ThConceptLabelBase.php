<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptLabelBase extends Model
{
    protected $table;
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
}
