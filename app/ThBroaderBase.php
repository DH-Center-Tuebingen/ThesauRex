<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThBroaderBase extends Model
{
    protected $table;
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'broader_id',
        'narrower_id',
    ];

}
