<?php

namespace App\Http\Middleware;

use App\Http\Middleware\Src\LowerStrings as Middleware;

class LowerStrings extends Middleware
{
    /**
     * The names of the attributes that should not be trimmed.
     *
     * @var array
     */
    protected $include = [
        'nickname',
        'email',
    ];
}
