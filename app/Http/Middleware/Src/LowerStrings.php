<?php

namespace App\Http\Middleware\Src;

use Illuminate\Foundation\Http\Middleware\TransformsRequest;
use Illuminate\Support\Str;

class LowerStrings extends TransformsRequest
{
    /**
     * The attributes that should not be lowered. Ignored if $include is set.
     *
     * @var array
     */
    protected $except = [
        //
    ];

    /**
     * The attributes that should be lowered.
     *
     * @var array
     */
    protected $include = [
        //
    ];

    /**
     * Transform the given value.
     *
     * @param  string  $key
     * @param  mixed  $value
     * @return mixed
     */
    protected function transform($key, $value)
    {
        if (count($this->include) > 0) {
            if (!in_array($key, $this->include, true)) {
                return $value;
            }
        } else {
            if (in_array($key, $this->except, true)) {
                return $value;
            }
        }

        return is_string($value) ? Str::lower($value) : $value;
    }
}
