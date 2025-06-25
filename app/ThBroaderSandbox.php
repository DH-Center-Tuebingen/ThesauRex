<?php

namespace App;

class ThBroaderSandbox extends ThBroaderBase
{
    protected $table = 'th_broaders_master';

    public function getConceptClass(): string
    {
        return ThConceptSandbox::class;
    }
}
