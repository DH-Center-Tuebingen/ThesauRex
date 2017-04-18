<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConcept extends Model
{
    protected $table = 'th_concept_master';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'concept_url',
        'concept_scheme',
        'lasteditor',
    ];
}
