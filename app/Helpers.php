<?php

namespace App;

use App\Bibliography;
use App\ThBroader;
use App\ThBroaderSandbox;
use App\ThConcept;
use App\ThConceptSandbox;
use App\ThConceptLabel;
use App\ThConceptLabelSandbox;
use App\ThConceptNote;
use App\ThConceptNoteSandbox;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class Helpers {
    public static function parseBoolean($str) {
        $acceptable = [true, 1, '1', 'true', 'TRUE'];
        return in_array($str, $acceptable, true);
    }

    public static function getTreeBuilder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptSandbox::query();
        } else {
            $builder = ThConcept::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['narrowers', 'broaders', 'notes.language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }, 'labels.language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }]);
        }
    }

    public static function getTreeBroaderBuilder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThBroaderSandbox::query();
        } else {
            $builder = ThBroader::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }]);
        }
    }

    public static function getTreeLabelBuilder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptLabelSandbox::query();
        } else {
            $builder = ThConceptLabel::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }]);
        }
    }

    public static function getTreeNoteBuilder($name, $langCode = null) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptNoteSandbox::query();
        } else {
            $builder = ThConceptNote::query();
        }
        if($langCode === null) {
            return $builder;
        } else {
            return $builder->with(['language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }]);
        }
    }
}
