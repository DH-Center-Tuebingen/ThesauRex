<?php

namespace App;

class Role extends \Spatie\Permission\Models\Role
{
    /**
     * The attributes that are assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'guard_name',
    ];

    const rules = [
        'name'          => 'required|alpha_dash|max:255|unique:roles',
        'display_name'  => 'string|max:255',
        'description'   => 'string|max:255',
        'derived_from'  => 'integer|exists:role_presets,id'
    ];
    const patchRules = [
        'display_name'  => 'string|max:255',
        'description'   => 'string|max:255',
    ];

    public function derived() {
        return $this->hasOne('App\RolePreset', 'id', 'derived_from');
    }
}
