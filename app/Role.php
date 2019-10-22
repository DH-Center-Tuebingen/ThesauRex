<?php

namespace App;

class Role extends \Spatie\Permission\Models\Role
{
    const rules = [
        'name'          => 'required|alpha_dash|max:255|unique:roles',
        'display_name'  => 'string|max:255',
        'description'   => 'string|max:255',
    ];
    const patchRules = [
        'display_name'  => 'string|max:255',
        'description'   => 'string|max:255',
    ];
}
