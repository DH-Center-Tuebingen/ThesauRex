<?php

namespace App;

class ThBroader extends ThBroaderBase
{
    protected $table = 'th_broaders';
    
    public function getConceptClass(): string
    {
        return ThConcept::class;
    }
}
