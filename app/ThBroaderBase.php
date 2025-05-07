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

    public function narrower()
    {
        return $this->belongsTo(ThConcept::class, 'narrower_id');
    }
    
    public function broader()
    {
        return $this->belongsTo(ThConcept::class, 'broader_id');
    }
}
