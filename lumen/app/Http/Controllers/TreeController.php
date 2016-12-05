<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use \DB;

class TreeController extends BaseController
{
    //
    public function exportDefault() {
        $this->export('local');
    }

    public function export($format) {
        if($format === 'local') {

        } else if($format === 'js') {

        }
    }

    public function getLabels(Request $request) {
        $id = $request->get('id');
        $isExport = $request->get('isExport');

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($isExport == 'clone') {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

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

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($which == 'clone') {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

        $topConcepts = DB::table($thConcept)
            ->select('id', 'concept_url', 'concept_scheme', 'is_top_concept',
                DB::raw("public.\"getLabelForId\"(id, '".$lang."') as label, 0 as reclevel, '$which' as intree"))
            ->where('is_top_concept', '=', true)
            ->get();

        $rows = DB::select("
            WITH RECURSIVE
            q(id, lasteditor, concept_url, concept_scheme, is_top_concept, created_at, updated_at, broader_id, reclevel) AS
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
            $lbl = DB::select(DB::raw("select public.\"getLabelForId\"(".$row->id.", '".$lang."') as label"));
            $conceptNames[] = array('label' => $lbl[0]->label, 'url' => $row->concept_url, 'id' => $row->id);
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
                if(!$alreadySet) $concepts[$row->broader_id][] = array_merge(get_object_vars($row), get_object_vars($lbl[0]), ['intree' => $which]);
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

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($isExport == 'clone') {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

        // narrower
        $narrower = DB::table($thConcept . ' as c')
            ->select('*',
                DB::raw("public.\"getLabelForId\"(c.id, '".$lang."') as label")
            )
            ->join($thBroader .' as broad', 'c.id', '=', 'broad.narrower_id')
            ->where('broad.broader_id', '=', $id)
            ->get();
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
                ->select('*',
                    DB::raw("public.\"getLabelForId\"(c.id, '".$lang."') as label")
                )
                ->where('c.id', '=', $bid->broader_id)
                ->get();
            foreach($br as $b) $broader[] = $b;
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

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($isExport == 'clone') {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

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

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($isExport == 'clone') {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

        DB::table($thBroader)
            ->insert([
                'broader_id' => $broader,
                'narrower_id' => $id
            ]);
    }

    public function addConcept(Request $request) {
        $url = $request->get('concept_url');
        $scheme = $request->get('concept_scheme');
        $broader = $request->get('broader_id');
        $tc = $request->get('is_top_concept');
        $label = $request->get('prefLabel');
        $lang = $request->get('lang');

        $id = DB::table('th_concept')
            ->insertGetId([
                'concept_url' => $url,
                'concept_scheme' => $scheme,
                'is_top_concept' => $tc == 't'
            ]);

        DB::table('th_broaders')
            ->insert([
                'broader_id' => $broader,
                'narrower_id' => $id
            ]);

        DB::table('th_concept_label')
            ->insert([
                'label' => $label,
                'concept_id' => $id,
                'language_id' => $lang
            ]);
        return response()->json($id);
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
        q(id, lasteditor, concept_url, concept_scheme, last_modif, created_at, updated_at, is_top_concept, broader_id) AS
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
        foreach($rows as $row) {
            $tmpRow = $row;
            $id = $row->id;
            $broaderId = $row->broader_id;
            unset($tmpRow->id);
            unset($tmpRow->broader_id);
            $tmpRow->id_th_concept = $id;
            DB::table($thConcept)
                ->insert(get_object_vars($tmpRow)); //TODO stdclass
            $labels = DB::table($thLabelSrc)
                ->where('concept_id', '=', $id)
                ->get();
            foreach($labels as $l) {
                unset($l->id);
                DB::table($thLabel)
                    ->insert(get_object_vars($l)); //TODO stdclass
            }
            $broader = DB::table($thBroaderSrc)
                ->where('narrower_id', '=', $id)
                ->get();
            foreach($broader as $b) {
                DB::table($thBroader)
                    ->insert(get_object_vars($b)); //TODO stdclass
            }
        }
        DB::table($thBroader)
            ->where('narrower_id', '=', $elemId)
            ->delete();
        DB::table($thBroader)
            ->insert([
                'broader_id' => $newBroader,
                'narrower_id' => $elemId
            ]);
        DB::table($thConcept)
            ->where('id', '=', $elemId)
            ->update([
                'is_top_concept' => $isTopConcept
            ]);
        return response()->json($rows);
    }

    public function updateRelation(Request $request) {
        $narrow = $request->get('narrower_id');
        $oldBroader = $request->get('old_broader_id');
        $broader = $request->get('broader_id');
        $lang = $request->get('lang');
        $isExport = $request->get('isExport');

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($isExport) {
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
        }

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
                q(id, lasteditor, concept_url, concept_scheme, is_top_concept, updated_at, created_at, broader_id, reclevel) AS
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
            $lbl = DB::select(DB::raw("select public.\"getLabelForId\"(".$row->id.", '".$lang."') as label"));
            $conceptNames[] = array('label' => $lbl[0]->label, 'url' => $row->concept_url, 'id' => $row->id);
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

    public function search(Request $request) {
        if(!$request->has('val')) return response()->json();
        $val = $request->get('val');
        if($request->has('tree')) $which = $request->get('tree');
        else $which = 'master';
        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';

        $suffix = $which == 'clone' ? '_export' : '';
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;

        $matchedConcepts = DB::table($thLabel . ' as l')
            ->select('c.concept_url', 'c.id')
            ->join($thConcept . ' as c', 'c.id', '=', 'l.concept_id')
            ->join('th_language as lng', 'l.language_id', '=', 'lng.id')
            ->where([
                ['label', 'ilike', '%' . $val . '%'],
                ['lng.short_name', '=', $lang]
            ])
            ->groupBy('c.id')
            ->get();
        $labels = [];
        foreach($matchedConcepts as $concept) {
            $labels[] = [
                'label' => $this->getLabel($concept->concept_url)->label,
                'id' => $concept->id
            ];
        }
        return response()->json($labels);
    }
}
