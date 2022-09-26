<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class SoftDeletesWithTrashedScope extends SoftDeletingScope
{
    public function apply(Builder $builder, Model $model)
    {
    }
}