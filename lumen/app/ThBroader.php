<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThBroader extends Model
{
    protected $table = 'th_broaders';
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
