<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Scopes\SoftDeletesWithTrashedScope;

trait SoftDeletesWithTrashed
{
    use SoftDeletes;

    public static function bootSoftDeletes()
    {
        static::addGlobalScope(new SoftDeletesWithTrashedScope);
    }
}