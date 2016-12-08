<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use \DB;

class TreeController extends BaseController
{
    //
    private function removeIllegalChars($input) {
        return str_replace(['.', ',', ' ', '?', '!'], '_', $input);
    }

    public function exportDefault() {
        $this->export('local');
    }

    public function export($format) {
        if($format === 'local') {

        } else if($format === 'js') {

        }
    }

    public function getAnyLabel($thesaurus_url, $suffix = '') {
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;
        $label = DB::table($thLabel .' as lbl')
            ->join('th_language as lang', 'lang.id', '=', 'lbl.language_id')
            ->join($thConcept . ' as con', 'lbl.concept_id', '=', 'con.id')
            ->where('con.concept_url', '=', $thesaurus_url)
            ->orderBy('lbl.concept_label_type', 'asc')
            ->first();
        return $label;
    }

    public function getLabel($thesaurus_url, $suffix = '', $lang = 'de') {
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;
        $label = DB::table($thLabel .' as lbl')
            ->join('th_language as lang', 'lang.id', '=', 'lbl.language_id')
            ->join($thConcept . ' as con', 'lbl.concept_id', '=', 'con.id')
            ->where([
                ['con.concept_url', '=', $thesaurus_url],
                ['lang.short_name', '=', $lang]
            ])
            ->orderBy('lbl.concept_label_type', 'asc')
            ->first();
        return $label;
    }

    public function getLabels(Request $request) {
        $id = $request->get('id');
        $isExport = $request->get('isExport');
        $suffix = $isExport == 'clone' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $labels = DB::table($thLabel .' as lbl')
            ->select('lbl.id', 'label', 'concept_id', 'language_id', 'concept_label_type', 'lang.display_name', 'lang.short_name', 'lang.id')
            ->join('th_language as lang', 'lang.id', '=', 'language_id')
            ->where('concept_id', '=', $id)
            ->get();
        return response()->json($labels);
    }

    public function getLanguages() {
        return response()->json(
            DB::table('th_language')
                ->select('id', 'display_name', 'short_name')
                ->get()
        );
    }

    public function getTree(Request $request) {
        if($request->has('tree')) $which = $request->get('tree');
        else $which = 'master';
        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';

        $suffix = $which == 'clone' ? '_export' : '';
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $topConcepts = DB::table($thConcept)
            ->select('id', 'concept_url', 'concept_scheme', 'is_top_concept',
                DB::raw("0 as reclevel, '$which' as intree"))
            ->where('is_top_concept', '=', true)
            ->get();

        foreach($topConcepts as &$tC) {
            $lbl = $this->getLabel($tC->concept_url, $suffix, $lang);
            if($lbl == null || !property_exists($lbl, 'label')) {
                $lbl = $this->getAnyLabel($tC->concept_url, $suffix);
                if($lbl == null || !property_exists($lbl, 'label')) continue;
            }
            $tC->label = $lbl->label;
        }

        $rows = DB::select("
            WITH RECURSIVE
            q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, broader_id, reclevel) AS
                (
                    SELECT  conc.*, -1, 0
                    FROM    $thConcept conc
                    WHERE   is_top_concept = true
                    UNION ALL
                    SELECT  conc2.*, broad.broader_id, reclevel + 1
                    FROM    $thConcept conc2
                    JOIN    $thBroader broad
                    ON      conc2.id = broad.narrower_id
                    JOIN    q
                    ON      broad.broader_id = q.id
                    WHERE   conc2.is_top_concept = false
                )
            SELECT  q.*
            FROM    q
            ORDER BY concept_url ASC
        ");
        $concepts = array();
        $conceptNames = array();
        foreach($rows as $row) {
            if(empty($row)) continue;
            $lbl = $this->getLabel($row->concept_url, $suffix, $lang);
            if($lbl == null || !property_exists($lbl, 'label')) {
                $lbl = $this->getAnyLabel($row->concept_url, $suffix);
                if($lbl == null || !property_exists($lbl, 'label')) continue;
            }
            $conceptNames[] = array('label' => $lbl->label, 'url' => $row->concept_url, 'id' => $row->id);
            if($row->broader_id > 0) {
                $alreadySet = false;
                if(isset($concepts[$row->broader_id])) {
                    foreach($concepts[$row->broader_id] as $con) {
                        if($con['id'] == $row->id) {
                            $alreadySet = true;
                            break;
                        }
                    }
                }
                $lblArr = [ 'label' => $lbl->label ];
                if(!$alreadySet) $concepts[$row->broader_id][] = array_merge(get_object_vars($row), $lblArr, ['intree' => $which]);
            }
        }
        return response()->json([
            'topConcepts' => $topConcepts,
            'concepts' => $concepts,
            'conceptNames' => $conceptNames
        ]);
    }

    public function getRelations(Request $request) {
        if(!$request->has('id')) {
            return response()->json([
                'error' => 'id field is mandatory'
            ]);
        }
        $id = $request->get('id');

        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';
        $isExport = $request->get('isExport');

        $suffix = $isExport == 'clone' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        // narrower
        $narrower = DB::table($thConcept . ' as c')
            ->join($thBroader .' as broad', 'c.id', '=', 'broad.narrower_id')
            ->where('broad.broader_id', '=', $id)
            ->get();
        foreach($narrower as &$n) {
            $lbl = $this->getLabel($n->concept_url, $suffix, $lang);
            if($lbl == null || !property_exists($lbl, 'label')) {
                $lbl = $this->getAnyLabel($n->concept_url, $suffix);
                if($lbl == null || !property_exists($lbl, 'label')) continue;
            }
            $n->label = $lbl->label;
        }
        // broader
        $broaderIds = DB::table($thConcept . ' as c')
            ->select('broad.broader_id')
            ->join($thBroader . ' as broad', 'c.id', '=', 'broad.narrower_id')
            ->where('c.id', '=', $id)
            ->get();
        $broader = array();
        foreach($broaderIds as $bid) {
            if($bid->broader_id == -1) continue;
            $br = DB::table($thConcept . ' as c')
                ->where('c.id', '=', $bid->broader_id)
                ->get();
            foreach($br as &$b) {
                $lbl = $this->getLabel($b->concept_url, $suffix, $lang);
                if($lbl == null || !property_exists($lbl, 'label')) {
                    $lbl = $this->getAnyLabel($b->concept_url, $suffix);
                    if($lbl == null || !property_exists($lbl, 'label')) continue;
                }
                $b->label = $lbl->label;
                $broader[] = $b;
            }
        }
        return response()->json([
            'broader' => $broader,
            'narrower' => $narrower
        ]);
    }

    public function import() {

    }

    public function removeConcept(Request $request) {
        $id = $request->get('id');
        $isExport = $request->get('isExport');

        $suffix = $isExport == 'clone' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        if($request->has('broaderId')) { //is broader
            $broaderId = $request->get('broaderId');
            DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $broaderId],
                    ['narrower_id', '=', $id]
                ])
                ->delete();
            //TODO
            //if count narrower_id = $id == 0 => concept with $id is now top_concept
            $brCnt = DB::table($thBroader)
                ->where('narrower_id', '=', $id)
                ->count();
            if($brCnt == 0) {
                DB::table($thConcept)
                    ->where('id', '=', $id)
                    ->update([
                        'is_top_concept' => 't'
                    ]);
            }
        } else if($request->has('narrowerId')) { //is narrower
            $narrowerId = $request->get('narrowerId');
            DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $id],
                    ['narrower_id', '=', $narrowerId]
                ])
                ->delete();
            //TODO
            $brCnt = DB::table($thBroader)
                ->where('narrower_id', '=', $narrowerId)
                ->count();

            if($brCnt == 0) {
                DB::table($thConcept)
                    ->where('id', '=', $narrowerId)
                    ->update([
                        'is_top_concept' => 't'
                    ]);
            }
        } else {
            return response()->json([
                'error' => 'missing id'
            ]);
        }
        return response()->json($id);
    }

    public function addBroader(Request $request) {
        $id = $request->get('id');
        $broader = $request->get('broader_id');
        $isExport = $request->get('isTmp');

        $suffix = $isExport == 'clone' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        DB::table($thBroader)
            ->insert([
                'broader_id' => $broader,
                'narrower_id' => $id
            ]);
    }

    public function addConcept(Request $request) {
        $projName = $request->get('projName');
        $scheme = $request->get('concept_scheme');
        $tc = $request->get('is_top_concept');
        $label = $request->get('prefLabel');
        $lang = $request->get('lang');

        $normalizedProjName = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $projName);
        $normalizedLabelName = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $label);
        $normalizedProjName = $this->removeIllegalChars($normalizedProjName);
        $normalizedLabelName = $this->removeIllegalChars($normalizedLabelName);
        $ts = date("YmdHis");

        $url = "https://spacialist.escience.uni-tuebingen.de/$normalizedProjName/$normalizedLabelName#$ts";

        if($request->has('broader_id') && $request->has('is_top_concept') && $request->get('is_top_concept')) {
            return response()->json([
                'error' => 'Can not add top concept with broader. Please remove broader from the request or set is_top_concept to false'
            ]);
        }

        $id = DB::table('th_concept')
            ->insertGetId([
                'concept_url' => $url,
                'concept_scheme' => $scheme,
                'is_top_concept' => $tc,
                'lasteditor' => 'postgres'
            ]);

        if($request->has('broader_id')) {
            $broader = $request->get('broader_id');
            if($broader > 0) {
                DB::table('th_broaders')
                    ->insert([
                        'broader_id' => $broader,
                        'narrower_id' => $id
                    ]);
            }
        }

        DB::table('th_concept_label')
            ->insert([
                'label' => $label,
                'concept_id' => $id,
                'language_id' => $lang,
                'lasteditor' => 'postgres'
            ]);
        return response()->json([
            'newId' => $id,
            'url' => $url
        ]);
    }

    public function addLabel(Request $request) {
        $label = $request->get('label');
        $lang = $request->get('lang');
        $type = $request->get('type');
        $cid = $request->get('concept_id');
        $del = $request->get('delete');
        if($request->has('id')) {
            $id = $request->get('id');
            $cond = array(
                ['id', '=', $id],
                ['concept_id', '=', $cid],
                ['language_id', '=', $lang],
                ['concept_label_type', '=', $type]
            );
            if($request->has('del') && $del) {
                DB::table('th_concept_label')
                    ->where($cond)
                    ->delete();
            } else {
                DB::table('th_concept_label')
                    ->where($cond)
                    ->update([
                        'label' => $label
                    ]);
            }
        } else {
            $lblCount = DB::table('th_concept_label')
                ->where([
                    ['language_id', '=', $lang],
                    ['concept_id', '=', $cid]
                ])
                ->count();

            if($lblCount > 0) { //existing prefLabel for desired language, abort
                return response()->json([
                    'error' => 'Duplicate entry for language ' . $lang
                ]);
            }
            $id = DB::table('th_concept_label')
                ->insertGetId([
                    'id' => $id,
                    'label' => $label,
                    'concept_id' => $cid,
                    'language_id' => $lang,
                    'concept_label_type' => $type
                ]);
        }
        return response()->json($id);
    }

    public function copy(Request $request) {
        // Copy elements from source tree to cloned tree and vice versa
        $elemId = $request->get('id');
        $newBroader = $request->get('new_broader');
        $src = $request->get('src'); // 'master' or 'clone'
        $isTopConcept = $request->get('is_top_concept');

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($src == 'clone') {
            $thConceptSrc = $thConcept.'_export';
            $thLabelSrc = $thLabel.'_export';
            $thBroaderSrc = $thBroader.'_export';
        } else {
            $thConceptSrc = $thConcept;
            $thLabelSrc = $thLabel;
            $thBroaderSrc = $thBroader;
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

        $rows = DB::select("
        WITH RECURSIVE
        q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, broader_id) AS
            (
                SELECT  conc.*, -1
                FROM    $thConceptSrc conc
                WHERE   conc.id = $elemId
                UNION ALL
                SELECT  conc2.*, broad.broader_id
                FROM    $thConceptSrc conc2
                JOIN    $thBroaderSrc broad
                ON      conc2.id = broad.narrower_id
                JOIN    q
                ON      broad.broader_id = q.id
            )
        SELECT  q.*
        FROM    q
        ORDER BY concept_url ASC
        ");
        $tmpBroaders = [];
        foreach($rows as $row) {
            $tmpRow = $row;
            $id = $row->id;
            $broaderId = $row->broader_id;
            unset($tmpRow->broader_id);
            unset($tmpRow->id);
            if($tmpRow->created_at == '') unset($tmpRow->created_at);
            if($tmpRow->updated_at == '') unset($tmpRow->updated_at);
            $newId = DB::table($thConcept)
                ->insertGetId(get_object_vars($tmpRow));
            $labels = DB::table($thLabelSrc)
                ->where('concept_id', '=', $id)
                ->get();
            foreach($labels as $l) {
                unset($l->id);
                $l->concept_id = $newId;
                DB::table($thLabel)
                    ->insert(get_object_vars($l));
            }
            if($id == $elemId) continue;
            $broader = DB::table($thBroaderSrc . ' as b')
                ->join($thConceptSrc . ' as c', 'c.id', '=', 'b.broader_id')
                ->where('narrower_id', '=', $id)
                ->value('c.concept_url');
            if(!isset($tmpBroaders[$newId])) $tmpBroaders[$newId] = [];
            $tmpBroaders[$newId][] = $broader;
        }
        foreach($tmpBroaders as $k => $v) {
            foreach($v as $b) {
                $bId = DB::table($thConcept)
                    ->where('concept_url', '=', $b)
                    ->value('id');
                DB::table($thBroader)
                    ->insert([
                        'broader_id' => $bId,
                        'narrower_id' => $k
                    ]);
            }
        }
        if($thBroader != null) {
            DB::table($thBroader)
                ->insert([
                    'broader_id' => $newBroader,
                    'narrower_id' => $newId
                ]);
        }
        return response()->json($rows);
    }

    public function updateRelation(Request $request) {
        $narrow = $request->get('narrower_id');
        $oldBroader = $request->get('old_broader_id');
        $broader = $request->get('broader_id');
        $lang = $request->get('lang');
        $isExport = $request->get('isExport');

        $suffix = $isExport ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        DB::table($thBroader)
            ->where([
                ['narrower_id', '=', $narrow],
                ['broader_id', '=', $oldBroader]
            ])
            ->update([
                'broader_id' => $broader
            ]);

        $isTopConcept = $broader == -1;
        DB::table($thConcept)
            ->where('id', '=', $narrow)
            ->update([
                'is_top_concept' => $isTopConcept
            ]);

        $rows = DB::select("
            WITH RECURSIVE
                q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, broader_id, reclevel) AS
                (
                    SELECT  conc.*, -1, 0
                    FROM    $thConcept conc
                    WHERE   id = $broader OR id = $oldBroader
                    UNION ALL
                    SELECT  conc2.*, broad.broader_id, reclevel + 1
                    FROM    $thConcept conc2
                    JOIN    $thBroader broad
                    ON      conc2.id = broad.narrower_id
                    JOIN    q
                    ON      broad.broader_id = q.id
                    WHERE   conc2.is_top_concept = false
                )
            SELECT  q.*
            FROM    q
            ORDER BY concept_url ASC
        ");
        $concepts = array();
        $conceptNames = array();
        foreach($rows as $row) {
            if(empty($row)) continue;
            $lbl = $this->getLabel($row->concept_url, $suffix, $lang);
            if($lbl == null || !property_exists($lbl, 'label')) {
                $lbl = $this->getAnyLabel($row->concept_url, $suffix);
                if($lbl == null || !property_exists($lbl, 'label')) continue;
            }
            $conceptNames[] = array('label' => $lbl->label, 'url' => $row->concept_url, 'id' => $row->id);
            $bid = $row->broader_id;
            if($bid > 0 && ($bid == $oldBroader || $bid == $broader)) {
                $alreadySet = false;
                foreach($concepts[$row->broader_id] as $con) {
                    if($con->id == $row->id) {
                        $alreadySet = true;
                        break;
                    }
                }
                if(!$alreadySet) $concepts[$row->broader_id][] = array_merge(get_object_vars($row), $lbl);
            }
        }
        return response()->json([
            'concepts' => $concepts,
            'conceptNames' => $conceptNames
        ]);
    }
}
