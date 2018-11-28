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

    // detail level
    // 0 = no relations
    // 1 = labels
    // 2 = all
    public static function getTreeBuilder($name, $langCode = null, $detailLevel = 2) {
        $builder;
        if($name === 'sandbox') {
            $builder = ThConceptSandbox::query();
        } else {
            $builder = ThConcept::query();
        }
        if($detailLevel === 0 || $langCode === null) {
            return $builder;
        } else {
            $labelWith = [
                'labels.language' => function($query) use($langCode) {
                    $query->orderByRaw("short_name = '$langCode' desc");
                }
            ];
            $detailedWith = [];
            if($detailLevel == 2) {
                $detailedWith = [
                    'notes.language' => function($query) use($langCode) {
                        $query->orderByRaw("short_name = '$langCode' desc");
                    },
                    'narrowers',
                    'broaders'
                ];
            }
            $withs = array_merge($labelWith, $detailedWith);
            return $builder->with($withs);
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
