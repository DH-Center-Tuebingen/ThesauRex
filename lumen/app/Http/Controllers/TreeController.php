<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Easyrdf\Easyrdf\Lib\EasyRdf;
use Easyrdf\Easyrdf\Lib\EasyRdf\Serialiser;
use \DB;
use Illuminate\Support\Facades\Storage;
use App\ThBroader;
use App\ThBroaderProject;
use App\ThConcept;
use App\ThConceptProject;
use App\ThConceptLabel;
use App\ThConceptLabelProject;

class TreeController extends Controller
{
    private $importTypes = ['extend', 'update', 'new'];

    //
    private function removeIllegalChars($input) {
        return str_replace(['.', ',', ' ', '?', '!'], '_', $input);
    }

    public function sortLabels($a, $b) {
        $pos = strcasecmp($a['label'], $b['label']);
        if($pos == 0) {
            $pos = strcasecmp($a['broader_label'], $b['broader_label']);
        }
        return $pos;
    }

    public function import(Request $request) {
        if(!$request->hasFile('file') || !$request->file('file')->isValid()) return response()->json('null');
        $file = $request->file('file');
        $type = $request->get('type');

        if(!in_array($type, $this->importTypes)) {
            return response()->json([
                'error' => 'Please provide an import type. \'type\' has to be one of \'' . implode('\', \'', $this->importTypes) . '\''
            ]);
        }

        $treeName = $request->get('treeName');
        $suffix = $treeName == 'project' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        if($type == 'new') {
            DB::table($thConcept)
                ->delete();
        }

        $languages = [];
        foreach(DB::table('th_language')->get() as $l) {
            $languages[$l->short_name] = $l->id;
        }

        $graph = new \EasyRdf_Graph();
        $graph->parseFile($file->getRealPath());
        $resources = $graph->resources();
        $relations = [];
        foreach($resources as $url => $r) {
            $conceptExists = DB::table($thConcept)
                ->where('concept_url', '=', $url)
                ->count() === 1;
            //if type = extend we only want to add new concepts (count = 0)
            if($type == 'extend' && $conceptExists) continue;

            $isTopConcept = count($r->allResources('skos:topConceptOf')) > 0;
            $scheme = '';
            $lasteditor = 'postgres';

            $needsUpdate = $type == 'update' && $conceptExists;
            if($needsUpdate) {
                $cid = DB::table($thConcept)
                    ->where('concept_url', '=', $url)
                    ->value('id');
            } else {
                $cid = DB::table($thConcept)
                    ->insertGetId([
                        'concept_url' => $url,
                        'concept_scheme' => $scheme,
                        'is_top_concept' => $isTopConcept,
                        'lasteditor' => $lasteditor
                ]);
            }

            $prefLabels = $r->allLiterals('skos:prefLabel');
            foreach($prefLabels as $pL) {
                $lid = $languages[$pL->getLang()];
                $label = $pL->getValue();
                if($needsUpdate) {
                    $where = [
                        ['concept_id', '=', $cid],
                        ['language_id', '=', $lid],
                        ['concept_label_type', '=', 1]
                    ];
                    $cnt = DB::table($thLabel)
                        ->where($where)
                        ->count();
                    if($cnt === 1) {
                        DB::table($thLabel)
                            ->where($where)
                            ->update([
                                'label' => $label,
                                'lasteditor' => $lasteditor
                            ]);
                    } else {
                        DB::table($thLabel)
                            ->insert([
                                'lasteditor' => $lasteditor,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 1
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'lasteditor' => $lasteditor,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 1
                    ]);
                }
            }

            $altLabels = $r->allLiterals('skos:altLabel');
            foreach($altLabels as $aL) {
                $lid = $languages[$aL->getLang()];
                $label = $aL->getValue();
                if($needsUpdate) {
                    $where = [
                        ['concept_id', '=', $cid],
                        ['language_id', '=', $lid],
                        ['label', '=', $label]
                    ];
                    $cnt = DB::table($thLabel)
                        ->where($where)
                        ->count();
                    if($cnt === 0) {
                        DB::table($thLabel)
                            ->insert([
                                'lasteditor' => $lasteditor,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 2
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'lasteditor' => $lasteditor,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 2
                    ]);
                }
            }

            $broaders = $r->allResources('skos:broader');
            foreach($broaders as $broader) {
                $relations[] = [
                    'broader' => $broader->getUri(),
                    'narrower' => $url
                ];
            }

            $narrowers = $r->allResources('skos:narrower');
            foreach($narrowers as $narrower) {
                $relations[] = [
                    'broader' => $url,
                    'narrower' => $narrower->getUri()
                ];
            }
        }
        $relations = array_unique($relations, SORT_REGULAR);
        foreach($relations as $rel) {
            $b = $rel['broader'];
            $n = $rel['narrower'];
            $bid = DB::table($thConcept)
                ->where('concept_url', '=', $b)
                ->value('id');
            $nid = DB::table($thConcept)
                ->where('concept_url', '=', $n)
                ->value('id');
            $relationExists = DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $bid],
                    ['narrower_id', '=', $nid]
                ])
                ->count() === 1;
            if(!$relationExists) {
                DB::table($thBroader)
                    ->insert([
                        'broader_id' => $bid,
                        'narrower_id' => $nid
                ]);
            }
        }
        return response()->json('');
    }

    public function export(Request $request) {
        if($request->has('format')) $format = $request->get('format');
        else $format = 'rdf';
        $treeName = $request->get('treeName');
        $suffix = $treeName == 'project' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $graph = new \EasyRdf_Graph();

        if($request->has('root')) {
            $id = $request->get('root');
            $concepts = DB::select("
                WITH RECURSIVE
                q(id, concept_url) AS
                    (
                        SELECT  conc.*
                        FROM    $thConcept conc
                        WHERE   conc.id = $id
                        UNION ALL
                        SELECT  conc2.*
                        FROM    $thConcept conc2
                        JOIN    $thBroader broad
                        ON      conc2.id = broad.narrower_id
                        JOIN    q
                        ON      broad.broader_id = q.id
                    )
                SELECT  q.*
                FROM    q
                ORDER BY id ASC
            ");
        } else {
            $concepts = DB::table($thConcept)
                ->get();
        }
        foreach($concepts as $concept) {
            $concept_id = $concept->id;
            $url = $concept->concept_url;
            $is_top_concept = $concept->is_top_concept;
            $curr = $graph->resource($url);
            $labels = DB::table($thLabel . ' as lbl')
                ->select('label', 'short_name', 'concept_label_type')
                ->join('th_language as lang', 'lbl.language_id', '=', 'lang.id')
                ->where('concept_id', '=', $concept_id)
                ->get();
            foreach($labels as $label) {
                $lbl = $label->label;
                $lang = $label->short_name;
                $type = $label->concept_label_type;
                if($type == 1) {
                    $curr->addLiteral('skos:prefLabel', $lbl, $lang);
                } else if($type == 2) {
                    $curr->addLiteral('skos:altLabel', $lbl, $lang);
                }
            }
            if(!$is_top_concept) {
                $broaders = DB::table($thBroader)
                    ->select('broader_id')
                    ->where('narrower_id', '=', $concept_id)
                    ->get();
                foreach($broaders as $broader) {
                    $broader_url = DB::table($thConcept)
                        ->where('id', '=', $broader->broader_id)
                        ->value('concept_url');
                    $curr->addResource('skos:broader', $broader_url);
                }
            } else {
                $curr->addResource('skos:topConceptOf', "http://we.should.think.of/a/better/name/for/our/scheme");
            }
            $narrowers = DB::table($thBroader)
                ->select('narrower_id')
                ->where('broader_id', '=', $concept_id)
                ->get();
            foreach($narrowers as $narrower) {
                $narrower_url = DB::table($thConcept)
                    ->where('id', '=', $narrower->narrower_id)
                    ->value('concept_url');
                $curr->addResource('skos:narrower', $narrower_url);
            }
            $curr->addType('skos:Concept');
        }
        if($format === 'rdf') {
            $arc = new \EasyRdf_Serialiser_Arc();
            $data = $arc->serialise($graph, 'rdfxml');
        } else if($format === 'js') {
            $data = $graph->serialise('json');
        }
        if (!is_scalar($data)) {
            $data = var_export($data, true);
        }

        //dirty hack, because it is not possible to get the desired output with either correct namespace or correct element structure
        $nsFound = preg_match('@xmlns:([^=]*)="http://www.w3.org/2004/02/skos/core#"@', $data, $matches);
        if($nsFound === 1) {
            $skosNs = $matches[1];
            $data = str_replace($skosNs . ':', 'skos:', $data);
            $data = str_replace('xmlns:' . $skosNs . '="http://www.w3.org/2004/02/skos/core#"', 'xmlns:skos="http://www.w3.org/2004/02/skos/core#"', $data);
        }

        $file = uniqid() . '.rdf';
        Storage::put(
            $file,
            $data
        );
        return response()->download(storage_path() . '/app/' . $file)->deleteFileAfterSend(true);
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

    public function getLabelById($id, $suffix = '', $lang = 'de') {
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;
        $label = DB::table($thLabel .' as lbl')
            ->join('th_language as lang', 'lang.id', '=', 'lbl.language_id')
            ->join($thConcept . ' as con', 'lbl.concept_id', '=', 'con.id')
            ->where([
                ['con.id', '=', $id],
                ['lang.short_name', '=', $lang]
            ])
            ->orderBy('lbl.concept_label_type', 'asc')
            ->first();
        return $label;
    }

    public function getLabels(Request $request) {
        $id = $request->get('id');
        $treeName = $request->get('treeName');
        $suffix = $treeName == 'project' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $labels = DB::table($thLabel .' as lbl')
            ->select('lbl.id', 'label', 'concept_id', 'language_id', 'concept_label_type', 'lang.display_name', 'lang.short_name')
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
        if($request->has('treeName')) $which = $request->get('treeName');
        else $which = 'master';
        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';

        if($which === 'project') {
            $suffix = '_export';
            $labelView = 'getFirstLabelForLanguagesFromExport';
        } else {
            $suffix = '';
            $labelView = 'getFirstLabelForLanguagesFromMaster';
        }
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $topConcepts = DB::table($thConcept . ' as c')
            ->select('id', 'c.concept_url', 'concept_scheme', 'is_top_concept', 'f.label',
                DB::raw("0 as reclevel"))
            ->join($labelView . ' as f', 'c.concept_url', '=', 'f.concept_url')
            ->where([
                ['is_top_concept', '=', true],
                ['f.lang', '=', $lang]
            ])
            ->get();

        $rows = DB::select("
            WITH RECURSIVE
            q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, label, broader_id, reclevel) AS
                (
                    SELECT  conc.*, f.label, -1, 0
                    FROM    $thConcept conc
                    JOIN    \"$labelView\" as f
                    ON      conc.concept_url = f.concept_url
                    WHERE   is_top_concept = true
                    AND     f.lang = '$lang'
                    UNION ALL
                    SELECT  conc2.*, f.label, broad.broader_id, reclevel + 1
                    FROM    $thConcept conc2
                    JOIN    $thBroader broad
                    ON      conc2.id = broad.narrower_id
                    JOIN    q
                    ON      broad.broader_id = q.id
                    JOIN    \"$labelView\" as f
                    ON      conc2.concept_url = f.concept_url
                    WHERE   conc2.is_top_concept = false
                    AND     f.lang = '$lang'
                )
            SELECT  q.*
            FROM    q
            ORDER BY is_top_concept DESC, label ASC
        ");
        $concepts = $this->createConceptLists($rows);
        return response()->json([
            'topConcepts' => $concepts['topConcepts'],
            'conceptList' => $concepts['conceptList'],
            'concepts' => $concepts['concepts']
        ]);
    }

    private function createConceptLists($rows) {
        $concepts = [];
        $topConcepts = [];
        $conceptList = [];
        foreach($rows as $concept) {
            if($concept->is_top_concept) {
                $topConcepts[$concept->id] = $concept;
            } else {
                $conceptList[$concept->id] = $concept;
            }
            if(empty($concept)) continue;
            if($concept->broader_id > 0) {
                $alreadySet = false;
                if(isset($concepts[$concept->broader_id])) {
                    foreach($concepts[$concept->broader_id] as $con) {
                        if($con['id'] == $concept->id) {
                            $alreadySet = true;
                            break;
                        }
                    }
                }
                if(!$alreadySet) $concepts[$concept->broader_id][] = $concept->id;
            }
        }
        return [
            'topConcepts' => $topConcepts,
            'conceptList' => $conceptList,
            'concepts' => $concepts
        ];
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
        $treeName = $request->get('treeName');

        if($treeName === 'project') {
            $suffix = '_export';
            $labelView = 'getFirstLabelForLanguagesFromExport';
        } else {
            $suffix = '';
            $labelView = 'getFirstLabelForLanguagesFromMaster';
        }
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        // narrower
        $narrower = DB::table($thConcept . ' as c')
            ->join($labelView . ' as f', 'c.concept_url', '=', 'f.concept_url')
            ->join($thBroader .' as broad', 'c.id', '=', 'broad.narrower_id')
            ->where([
                [ 'broad.broader_id', '=', $id ],
                [ 'lang', '=', $lang ]
            ])
            ->orderBy('label', 'asc')
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
                ->join($labelView . ' as f', 'c.concept_url', '=', 'f.concept_url')
                ->where('c.id', '=', $bid->broader_id)
                ->where('lang', '=', $lang)
                ->get();
            foreach($br as &$b) {
                $broader[] = $b;
            }
        }
        return response()->json([
            'broader' => $broader,
            'narrower' => $narrower
        ]);
    }

    public function deleteElementCascade(Request $request) {
        $id = $request->get('id');
        $treeName = $request->get('treeName');

        $suffix = $treeName == 'project' ? '_export' : '';
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        DB::table($thConcept)
            ->where('id', '=', $id)
            ->delete();
        //TODO remove descendants with no remaining broader
    }

    public function deleteElementOneUp(Request $request) {
        $id = $request->get('id');
        $broader_id = $request->get('broader_id');
        $treeName = $request->get('treeName');

        $suffix = $treeName == 'project' ? '_export' : '';
        $thConcept = 'th_concept' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $cnt = DB::table($thBroader)
            ->where('narrower_id', '=', $id)
            ->count();

        $narrowers = DB::table($thBroader)
            ->where('broader_id', '=', $id)
            ->get();
        if(!$request->has('broader_id')) {
            foreach($narrowers as $n) {
                DB::table($thConcept)
                    ->where('id', '=', $n->narrower_id)
                    ->update([
                        'is_top_concept' => true
                    ]);
            }
            //if this concept does not exist as narrower, we can delete it (since it only exists once; as top concept)
            if($cnt == 0) {
                DB::table($thConcept)
                    ->where('id', '=', $id)
                    ->delete();
            }
        } else {
            foreach($narrowers as $n) {
                DB::table($thBroader)
                    ->insert([
                        'broader_id' => $broader_id,
                        'narrower_id' => $n->narrower_id
                    ]);
            }
            //if this concept exists exactly once, we can delete it
            if($cnt == 1) {
                DB::table($thConcept)
                    ->where('id', '=', $id)
                    ->delete();
            }
        }
    }

    public function removeConcept(Request $request) {
        $id = $request->get('id');
        $treeName = $request->get('treeName');

        $suffix = $treeName == 'project' ? '_export' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        if($request->has('broader_id')) { //is broader
            $broaderId = $request->get('broader_id');
            DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $broaderId],
                    ['narrower_id', '=', $id]
                ])
                ->delete();
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
        } else if($request->has('narrower_id')) { //is narrower
            $narrowerId = $request->get('narrower_id');
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
        $treeName = $request->get('treeName');

        $entry;
        if($treeName == 'project') {
            $entry = new ThBroaderProject();
        } else {
            $entry = new ThBroader();
        }

        $entry->broader_id = $broader;
        $entry->narrower_id = $id;
        $entry->save();

        return response()->json([
            'broader' => $entry
        ]);
    }

    public function addConcept(Request $request) {
        $projName = $request->get('projName');
        $scheme = $request->get('concept_scheme');
        $label = $request->get('prefLabel');
        $lang = $request->get('lang');
        $treeName = $request->get('treeName');

        if($treeName == 'project') {
            $thConcept = new ThConceptProject();
            $thBroader = new ThBroaderProject();
            $thConceptLabel = new ThConceptLabelProject();
        } else {
            $thConcept = new ThConcept();
            $thBroader = new ThBroader();
            $thConceptLabel = new ThConceptLabel();
        }

        $tc = $request->has('is_top_concept') && $request->get('is_top_concept') === 'true';
        if($request->has('broader_id') && $tc) {
            return response()->json([
                'error' => 'Can not add top concept with broader. Please remove broader from the request or set is_top_concept to false'
            ]);
        }

        $normalizedProjName = transliterator_transliterate('Any-Latin; Latin-ASCII; [\u0100-\u7fff] remove; Lower()', $projName);
        $normalizedLabelName = transliterator_transliterate('Any-Latin; Latin-ASCII; [\u0100-\u7fff] remove; Lower()', $label);
        $normalizedProjName = $this->removeIllegalChars($normalizedProjName);
        $normalizedLabelName = $this->removeIllegalChars($normalizedLabelName);
        $ts = date("YmdHis");

        $url = "https://spacialist.escience.uni-tuebingen.de/$normalizedProjName/$normalizedLabelName#$ts";

        $thConcept->concept_url = $url;
        $thConcept->concept_scheme = $scheme;
        $thConcept->is_top_concept = $tc;
        $thConcept->lasteditor = 'postgres';
        $thConcept->save();

        if($request->has('broader_id')) {
            $broader = $request->get('broader_id');
            if($broader > 0) {
                $thBroader->broader_id = $broader;
                $thBroader->narrower_id = $thConcept->id;
                $thBroader->save();
            }
        }

        $thConceptLabel->label = $label;
        $thConceptLabel->concept_id = $thConcept->id;
        $thConceptLabel->language_id = $lang;
        $thConceptLabel->lasteditor = 'postgres';
        $thConceptLabel->save();

        return response()->json([
            'entry' => $thConcept
        ]);
    }

    public function removeLabel(Request $request) {
        $id = $request->get('id');
        $treeName = $request->get('treeName');

        $suffix = $treeName === 'project' ? '_export' : '';
        $thLabel = 'th_concept_label' . $suffix;

        DB::table($thLabel)
            ->where([
                ['id', '=', $id]
            ])
            ->delete();
    }

    public function addLabel(Request $request) {
        $label = $request->get('text');
        $lang = $request->get('lang');
        $type = $request->get('type');
        $cid = $request->get('concept_id');
        $treeName = $request->get('treeName');

        if($request->has('id')) {
            $id = $request->get('id');
            if($treeName == 'project') {
                $thLabel = ThConceptLabelProject::find($id);
            } else {
                $thLabel = ThConceptLabel::find($id);;
            }
            $thLabel->label = $label;
        } else {
            if($treeName == 'project') {
                $thLabel = new ThConceptLabelProject();
            } else {
                $thLabel = new ThConceptLabel();
            }
            if($type == 1) {
                $cond = [
                    ['language_id', '=', $lang],
                    ['concept_id', '=', $cid]
                ];
                if($treeName == 'project') {
                    $query = ThConceptLabelProject::where($cond);
                } else {
                    $query = ThConceptLabel::where($cond);
                }
                $lblCount = $query->count();
                if($lblCount > 0) { //existing prefLabel for desired language, abort
                    return response()->json([
                        'error' => 'Duplicate entry for language ' . $lang
                    ]);
                }
            }
            $thLabel->label = $label;
            $thLabel->concept_id = $cid;
            $thLabel->language_id = $lang;
            $thLabel->concept_label_type = $type;
            $thLabel->lasteditor = 'postgres';
        }
        $thLabel->save();
        return response()->json([
            'label' => $thLabel
        ]);
    }

    public function copy(Request $request) {
        // Copy elements from source tree to cloned tree and vice versa
        $elemId = $request->get('id');
        $newBroader = $request->get('new_broader');
        $src = $request->get('src'); // 'master' or 'project'
        $isTopConcept = $request->has('is_top_concept') && $request->get('is_top_concept') === 'true';
        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';

        $thConcept = 'th_concept';
        $thLabel = 'th_concept_label';
        $thBroader = 'th_broaders';
        if($src == 'project') {
            $thConceptSrc = $thConcept.'_export';
            $thLabelSrc = $thLabel.'_export';
            $thBroaderSrc = $thBroader.'_export';
            $labelView = 'getFirstLabelForLanguagesFromMaster';
        } else {
            $thConceptSrc = $thConcept;
            $thLabelSrc = $thLabel;
            $thBroaderSrc = $thBroader;
            $thConcept .= '_export';
            $thLabel .= '_export';
            $thBroader .= '_export';
            $labelView = 'getFirstLabelForLanguagesFromExport';
        }

        $rows = DB::select("
        WITH RECURSIVE
        q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, broader_id, lvl) AS
            (
                SELECT  conc.*, -1, 0
                FROM    $thConceptSrc conc
                WHERE   conc.id = $elemId
                UNION ALL
                SELECT  conc2.*, broad.broader_id, lvl + 1
                FROM    $thConceptSrc conc2
                JOIN    $thBroaderSrc broad
                ON      conc2.id = broad.narrower_id
                JOIN    q
                ON      broad.broader_id = q.id
            )
        SELECT  q.*
        FROM    q
        ORDER BY lvl ASC
        ");

        $newElemId = -1;
        $relations = [];
        foreach($rows as $row) {
            $oldId = $row->id;
            if($oldId == $elemId) $row->is_top_concept = $isTopConcept;
            $conceptAlreadyExists = false;
            $newId = DB::table($thConcept)
                ->where('concept_url', '=', $row->concept_url)
                ->value('id');
            if($newId === null) {
                if($src == 'project') $currentConcept = new ThConcept();
                else $currentConcept = new ThConceptProject();
                $currentConcept->concept_url = $row->concept_url;
                $currentConcept->concept_scheme = $row->concept_scheme;
                $currentConcept->lasteditor = 'postgres';
                $currentConcept->is_top_concept = $row->is_top_concept;
                $currentConcept->save();
            } else {
                $conceptAlreadyExists = true;
                if($src == 'project') $currentConcept = ThConcept::find($newId);
                else $currentConcept = ThConceptProject::find($newId);
            }
            $newId = $currentConcept->id;
            if($oldId == $elemId) {
                $newElemId = $newId;
                $relations[$oldId] = [
                    'oldId' => $oldId,
                    'newId' => $newId
                ];
            } else {
                $relations[$oldId] = [
                    'oldId' => $oldId,
                    'newId' => $newId,
                    'broader' => $row->broader_id
                ];
            }
            $labels = DB::table($thLabelSrc)
                ->where('concept_id', '=', $oldId)
                ->get();
            foreach($labels as $l) {
                $l->concept_id = $newId;
                $cnt = DB::table($thLabel)
                    ->where([
                        ['concept_id', '=', $l->concept_id],
                        ['label', '=', $l->label]
                    ])
                    ->count();
                //if this label already exists either as pref or alt label, we ignore it
                if($cnt > 0) continue;
                //if the concept already exists, set label type of copied label to alt label (2)
                if($conceptAlreadyExists) $l->concept_label_type = 2;
                if($src == 'project') $currentLabel = new ThConceptLabel();
                else $currentLabel = new ThConceptLabelProject();
                $currentLabel->lasteditor = 'postgres';
                $currentLabel->label = $l->label;
                $currentLabel->concept_id = $l->concept_id;
                $currentLabel->language_id = $l->language_id;
                $currentLabel->concept_label_type = $l->concept_label_type;
                $currentLabel->save();
            }
        }
        foreach($relations as $relation) {
            if(!isset($relation['broader'])) continue;
            $oldBroaderId = $relation['broader'];
            $broaderId = $relations[$oldBroaderId]['newId'];
            $narrowerId = $relation['newId'];
            $cnt = DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $broaderId],
                    ['narrower_id', '=', $narrowerId]
                ])
                ->count();
            if($cnt > 0) continue; //if relation already exists, do not add it again
            DB::table($thBroader)
                ->insert([
                    'broader_id' => $broaderId,
                    'narrower_id' => $narrowerId
                ]);
        }
        if($newBroader != -1 && $newElemId != -1) {
            DB::table($thBroader)
                ->insert([
                    'broader_id' => $newBroader,
                    'narrower_id' => $newElemId
                ]);
        }

        //get new elements
        $elements = DB::select("
            WITH RECURSIVE
            q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, label, broader_id, reclevel) AS
                (
                    SELECT  conc.*, f.label, $newBroader, 0
                    FROM    $thConcept conc
                    JOIN    \"$labelView\" as f
                    ON      conc.concept_url = f.concept_url
                    WHERE   conc.id = $newElemId
                    AND     f.lang = '$lang'
                    UNION ALL
                    SELECT  conc2.*, f.label, broad.broader_id, reclevel + 1
                    FROM    $thConcept conc2
                    JOIN    $thBroader broad
                    ON      conc2.id = broad.narrower_id
                    JOIN    q
                    ON      broad.broader_id = q.id
                    JOIN    \"$labelView\" as f
                    ON      conc2.concept_url = f.concept_url
                    WHERE   f.lang = '$lang'
                )
            SELECT  q.*
            FROM    q
            ORDER BY label ASC
        ");

        $concepts = $this->createConceptLists($elements);
        foreach($concepts['topConcepts'] as $tc) {
            $concepts['conceptList'][$tc->id] = $tc;
        }
        $clonedElement = '';
        foreach($concepts['conceptList'] as $k => $c) {
            if($c->id == $newElemId) {
                $clonedElement = $c;
                if(($key = array_search($c->id, $concepts['concepts'][$c->broader_id])) !== false) {
                    unset($concepts['concepts'][$c->broader_id][$key]);
                    if(count($concepts['concepts'][$c->broader_id]) === 0) {
                        unset($concepts['concepts'][$c->broader_id]);
                    }
                }
                unset($concepts['conceptList'][$k]);
                break;
            }
        }
        return response()->json([
            'conceptList' => $concepts['conceptList'],
            'concepts' => $concepts['concepts'],
            'clonedElement' => $clonedElement,
            'id' => $newElemId
        ]);
    }

    public function updateRelation(Request $request) {
        $narrow = $request->get('narrower_id');
        $oldBroader = $request->get('old_broader_id');
        $broader = $request->get('broader_id');
        $lang = $request->get('lang');
        $treeName = $request->get('treeName');

        if($treeName === 'project') {
            $suffix = '_export';
            $labelView = 'getFirstLabelForLanguagesFromExport';
        } else {
            $suffix = '';
            $labelView = 'getFirstLabelForLanguagesFromMaster';
        }
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        if($broader == -1) {
            DB::table($thBroader)
                ->where([
                    [ 'narrower_id', '=', $narrow ],
                    [ 'broader_id', '=', $oldBroader ]
                ])
                ->delete();
        } else {
            DB::table($thBroader)
                ->updateOrInsert([
                    'narrower_id' => $narrow,
                    'broader_id' => $oldBroader
                ],[
                    'broader_id' => $broader
                ]);
        }

        $isTopConcept = $broader == -1;
        DB::table($thConcept)
            ->where('id', '=', $narrow)
            ->update([
                'is_top_concept' => $isTopConcept
            ]);

        /*$rows = DB::select("
            WITH RECURSIVE
                q(id, concept_url, concept_scheme, lasteditor, is_top_concept, created_at, updated_at, label, broader_id, reclevel) AS
                (
                    SELECT  conc.*, f.label, -1, 0
                    FROM    $thConcept conc
                    JOIN    \"$labelView\" as f
                    ON      conc.concept_url = f.concept_url
                    WHERE   id = $broader OR id = $oldBroader
                    AND     f.lang = '$lang'
                    UNION ALL
                    SELECT  conc2.*, f.label, broad.broader_id, reclevel + 1
                    FROM    $thConcept conc2
                    JOIN    $thBroader broad
                    ON      conc2.id = broad.narrower_id
                    JOIN    q
                    ON      broad.broader_id = q.id
                    JOIN    \"$labelView\" as f
                    ON      conc2.concept_url = f.concept_url
                    WHERE   conc2.is_top_concept = false
                    AND     f.lang = '$lang'
                )
            SELECT  q.*
            FROM    q
            ORDER BY concept_url ASC
        ");
        $concepts = array();
        $conceptNames = array();
        foreach($rows as $row) {
            if(empty($row)) continue;
            $conceptNames[] = array('label' => $row->label, 'url' => $row->concept_url, 'id' => $row->id);
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
        ]);*/
        return response()->json([
            'concepts' => [],
            'conceptNames' => []
        ]);
    }

    public function search(Request $request) {
        if(!$request->has('val')) return response()->json();
        $val = $request->get('val');
        if($request->has('treeName')) $which = $request->get('treeName');
        else $which = 'master';
        if($request->has('lang')) $lang = $request->get('lang');
        else $lang = 'de';

        $suffix = $which == 'project' ? '_export' : '';
        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $matchedConcepts = DB::table($thLabel . ' as l')
            ->select('c.concept_url', 'c.id', 'b.broader_id')
            ->join($thConcept . ' as c', 'c.id', '=', 'l.concept_id')
            ->join('th_language as lng', 'l.language_id', '=', 'lng.id')
            ->join($thBroader . ' as b', 'b.narrower_id', '=', 'c.id')
            ->where([
                ['label', 'ilike', '%' . $val . '%'],
                ['lng.short_name', '=', $lang]
            ])
            ->groupBy('c.id', 'b.broader_id')
            ->orderBy('c.id')
            ->get();
        $labels = [];
        foreach($matchedConcepts as $concept) {
            $labels[] = [
                'label' => $this->getLabel($concept->concept_url, $suffix, $lang)->label,
                'id' => $concept->id,
                'broader_label' => $this->getLabelById($concept->broader_id, $suffix, $lang)->label,
                'broader_id' => $concept->broader_id
            ];
        }
        usort($labels, [$this, 'sortLabels']);
        return response()->json($labels);
    }

    public function getAllParents(Request $request) {
        if(!$request->has('id')) return response()->json();
        $id = $request->get('id');
        $where = "WHERE narrower_id = $id";
        if($request->has('treeName')) $which = $request->get('treeName');
        else $which = 'master';

        $suffix = $which == 'project' ? '_export' : '';
        $thBroader = 'th_broaders' . $suffix;

        $parents = array();
        $broaders = array();
        if($request->has('broader_id')) {
            $broaders[] = (object) [
                'broader_id' => $request->get('broader_id')
            ];
        } else {
            $broaders = DB::table($thBroader)
                ->select('broader_id')
                ->where('narrower_id', '=', $id)
                ->get();
        }

        foreach($broaders as $broader) {
            $currentWhere = $where . " AND broader_id = " . $broader->broader_id;
            $parents[] = DB::select("
                WITH RECURSIVE
                    q (broader_id, narrower_id, lvl) AS
                    (
                        SELECT b1.*, 0
                        FROM $thBroader b1
                        $currentWhere
                        UNION ALL
                        SELECT b2.*, lvl + 1
                        FROM $thBroader b2
                        JOIN q ON q.broader_id = b2.narrower_id
                    )
                SELECT q.*
                FROM q
                ORDER BY lvl DESC
            ");
        }

        return response()->json($parents);
    }
}
