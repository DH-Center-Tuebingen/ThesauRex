<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptProject extends Model
{
    protected $table = 'th_concept';
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
