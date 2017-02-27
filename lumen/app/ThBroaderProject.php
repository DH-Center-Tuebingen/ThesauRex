<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThBroaderProject extends Model
{
    protected $table = 'th_broaders_export';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'broader_id',
        'narrower_id',
    ];
    public $timestamps = false;
    public $primaryKey = '';
    public $incrementing = false;
}
