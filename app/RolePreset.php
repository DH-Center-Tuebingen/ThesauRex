<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RolePreset extends Model
{
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
    ];

    protected $appends = [
        'fullSet',
    ];

    protected $casts = [
        'rule_set' => 'array',
    ];

    public function getFullSetAttribute() {
        return $this->rule_set;
    }
}
