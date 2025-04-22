<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThConceptNoteBase extends Model
{
    protected $table;
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'content',
        'concept_id',
        'language_id',
    ];
}
