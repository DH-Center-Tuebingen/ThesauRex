<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ThLanguage extends Model
{
    protected $table = 'th_language';
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'display_name',
        'short_name',
    ];

    public function labels() {
        return $this->hasMany('App\ThConceptLabel', 'language_id');
    }
}
