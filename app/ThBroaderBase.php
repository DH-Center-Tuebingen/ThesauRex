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

    public static function exists($broaderId, $narrowerId): bool{
        return self::where('broader_id', $broaderId)
            ->where('narrower_id', $narrowerId)
            ->exists();
    }

    public static function add($broaderId, $narrowerId, $quietly = false): ?self {
        if(self::exists($broaderId, $narrowerId)) {
            return null;
        }
        $relation = new static();
        $relation->broader_id = $broaderId;
        $relation->narrower_id = $narrowerId;
        if($quietly) {
            $relation->saveQuietly();
        }else {
            $relation->save();
        }
        
        return $relation;
    }
}
