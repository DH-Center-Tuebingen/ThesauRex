<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

abstract class ThBroaderBase extends Model
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

    abstract public function getConceptClass(): string;

    public function narrower() {
        return $this->belongsTo($this->getConceptClass(), 'narrower_id');
    }

    public function broader() {
        return $this->belongsTo($this->getConceptClass(), 'broader_id');
    }    
}
