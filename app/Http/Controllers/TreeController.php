<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use EasyRdf\Graph;
use EasyRdf\Serialiser\RdfXml;
use \DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Helpers;
use App\Preference;
use App\ThBroader;
use App\ThBroaderSandbox;
use App\ThConcept;
use App\ThConceptSandbox;
use App\ThConceptLabel;
use App\ThConceptLabelSandbox;
use App\ThConceptNote;
use App\ThConceptNoteSandbox;
use App\ThLanguage;

class TreeController extends Controller
{
    public const importTypes = ['extend', 'update-extend', 'replace'];

    public function getTree(Request $request) {
        $user = \Auth::user();
        if(!$user->can('view_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', '');
        $lang = $user->getLanguage();

        $conceptTable = th_tree_builder($which, $lang, 1);

        $topConcepts = $conceptTable
            ->withCount('narrowers as children_count')
            ->where('is_top_concept', true)
            ->get();
        $topConcepts->each->setAppends(['parents', 'path']);
        return response()->json($topConcepts);
    }

    public function getDescendants(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('view_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', '');
        $lang = $user->getLanguage();

        try {
            if($which === 'sandbox') {
                ThConceptSandbox::findOrFail($id);
            } else {
                ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        $conceptTable = th_tree_builder($which, $lang, 1);
        $broaderTable = th_broader_builder($which, $lang);

        $ids = $broaderTable
            ->where('broader_id', $id)
            ->pluck('narrower_id');
        $concepts = $conceptTable
            ->withCount('narrowers as children_count')
            ->whereIn('id', $ids)
            ->get();
        $concepts->each->setAppends(['parents', 'path']);
        return response()->json($concepts);
    }

    public function getConcept(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('view_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', '');
        $lang = $user->getLanguage();

        try {
            if($which === 'sandbox') {
                ThConceptSandbox::findOrFail($id);
            } else {
                ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        $conceptTable = th_tree_builder($which, $lang);
        $concept = $conceptTable
            ->where('id', $id)
            ->first();
        $concept->broaders->loadMissing('labels.language');
        $concept->narrowers->loadMissing('labels.language');
        $concept->setAppends(['parents', 'path']);
        return response()->json($concept);
    }

    public function export(Request $request, $id = null) {
        $user = \Auth::user();
        if(!$user->can('export_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', '');
        $format = $request->query('format', 'rdf');

        $suffix = '';
        if($treeName === 'sandbox') {
            $suffix = '_master';
        }

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        if(isset($id)) {
            try {
                if($treeName === 'sandbox') {
                    ThConceptSandbox::findOrFail($id);
                } else {
                    ThConcept::findOrFail($id);
                }
            } catch(ModelNotFoundException $e) {
                return response()->json([
                    'error' => 'This concept does not exist'
                ], 400);
            }
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
            $conceptTable = th_tree_builder($treeName);
            $concepts = $conceptTable->get();
        }

        $graph = new Graph();

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
                if($type === 1) {
                    $curr->addLiteral('skos:prefLabel', $lbl, $lang);
                } else if($type === 2) {
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
            $arc = new RdfXml();
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
        return response()->download(storage_path('app') . '/' . $file)->deleteFileAfterSend(true);
    }

    public function addConcept(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', '');
        $suffix = '';
        if($which === 'sandbox') {
            $suffix = '_master';
        }

        $this->validate($request, [
            'label' => 'required|string',
            'language_id' => 'required|integer|exists:th_language,id',
            'parent_id' => "integer|exists:th_concept$suffix,id"
        ]);

        $projectName = Preference::getUserPreference($user->id, 'prefs.project-name')->value;

        $label = $request->get('label');
        $labelLangId = $request->get('language_id');
        $parentId = $request->get('parent_id');
        $isTop = !$request->has('parent_id');

        if($which === 'sandbox') {
            $thConcept = new ThConceptSandbox();
            $thBroader = new ThBroaderSandbox();
            $thConceptLabel = new ThConceptLabelSandbox();
        } else {
            $thConcept = new ThConcept();
            $thBroader = new ThBroader();
            $thConceptLabel = new ThConceptLabel();
        }

        $slugLabel = Str::slug($label);
        $slugProjectName = Str::slug($projectName);
        $scheme = 'no scheme';
        $ts = date("YmdHis");

        $url = "https://spacialist.escience.uni-tuebingen.de/$slugProjectName/$slugLabel#$ts";

        $thConcept->concept_url = $url;
        $thConcept->concept_scheme = $scheme;
        $thConcept->is_top_concept = $isTop;
        $thConcept->user_id = $user->id;
        $thConcept->save();

        if(!$isTop) {
            $thBroader->broader_id = $parentId;
            $thBroader->narrower_id = $thConcept->id;
            $thBroader->save();
        }

        $thConceptLabel->label = $label;
        $thConceptLabel->concept_id = $thConcept->id;
        $thConceptLabel->language_id = $labelLangId;
        $thConceptLabel->user_id = $user->id;
        $thConceptLabel->save();

        $thConcept->loadMissing('labels.language');
        $thConcept->children_count = 0;

        return response()->json($thConcept, 201);
    }

    public function cloneConceptFromTree(Request $request, $id, $bid) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $target = $request->query('t', '');
        $from = $request->query('s', '');

        if(($target === 'sandbox' && $from === 'sandbox') || ($target !== 'sandbox' && $from !== 'sandbox')) {
            return response([
                'error' => 'You can not clone a concept from the same tree'
            ], 403);
        }

        if($target !== 'sandbox') {
            $target = '';
        }
        if($from !== 'sandbox') {
            $from = '';
        }

        try {
            if($from === 'sandbox') {
                ThConceptSandbox::findOrFail($id);
            } else {
                ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist in source tree'
            ], 400);
        }
        if($bid != -1) {
            try {
                if($target === 'sandbox') {
                    ThConceptSandbox::findOrFail($bid);
                } else {
                    ThConcept::findOrFail($bid);
                }
            } catch(ModelNotFoundException $e) {
                return response()->json([
                    'error' => 'This concept does not exist in source tree'
                ], 400);
            }
        }

        $clonedConcept = self::cloneConceptTree($id, $bid, $from, $target, $user);

        $conceptTable = th_tree_builder($target, $user->getLanguage(), 1);

        $clonedConcept = $conceptTable
            ->withCount('narrowers as children_count')
            ->find($clonedConcept->id);
        $clonedConcept->setAppends(['parents', 'path']);

        return response()->json($clonedConcept);
    }

    public function deleteLabel(Request $request, $id) {
        $user = \Auth::user();

        if(!$user->can('edit_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->get('t');
        $lang = $user->getLanguage();

        $labelTable = th_label_builder($treeName);

        $elem = $labelTable
            ->where('id', $id)
            ->first();

        $prefLabelUpdated = false;
        // check if removed elem was pref label
        if($elem->concept_label_type === 1) {
            $labelTable = th_label_builder($treeName);
            // if there is another label of the same language
            // make it a pref label
            $newPrefLabel = $labelTable
                ->where([
                    ['language_id', $elem->language_id],
                    ['concept_id', $elem->concept_id],
                    ['concept_label_type', 2] // we have to add this, because the old prefLabel still exists
                ])
                ->orderBy('created_at')
                ->first();
            if(isset($newPrefLabel)) {
                $prefLabelUpdated = true;
                $newPrefLabel->concept_label_type = 1;
                $newPrefLabel->save();
            }
        }
        $elem->delete();

        // If label updated, return new pref label id
        // otherwise return empty success
        if($prefLabelUpdated) {
            return response()->json([
                'updated' => true,
                'id' => $newPrefLabel->id,
                'type' => $newPrefLabel->concept_label_type
            ]);
        } else {
            return response()->json(null, 204);
        }
    }

    public function deleteNote(Request $request, $id) {
        $user = \Auth::user();

        if(!$user->can('edit_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->get('t');
        $lang = $user->getLanguage();

        $noteTable = th_note_builder($treeName);

        $noteTable
            ->where('id', $id)
            ->delete();

        return response()->json(null, 204);
    }

    public function addLabel(Request $request) {
        $user = \Auth::user();
        if(!$user->can('edit_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'content' => 'required|string',
            'lid' => 'required|integer|exists:th_language,id',
            'cid' => 'required|integer',
            'tree_name' => 'nullable|string',
        ]);

        $label = $request->get('content');
        $langId = $request->get('lid');
        $cid = $request->get('cid');
        $treeName = $request->get('tree_name');

        try {
            if($treeName === 'sandbox') {
                ThConceptSandbox::findOrFail($cid);
            } else {
                ThConcept::findOrFail($cid);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        $cond = [
            ['language_id', '=', $langId],
            ['concept_id', '=', $cid],
            ['concept_label_type', '=', 1]
        ];

        if($treeName == 'sandbox') {
            $thLabel = new ThConceptLabelSandbox();
            $query = ThConceptLabelSandbox::where($cond);
        } else {
            $thLabel = new ThConceptLabel();
            $query = ThConceptLabel::where($cond);
        }
        // set label type based on existing labels
        $type = $query->count() > 0 ? 2 : 1;

        $thLabel->label = $label;
        $thLabel->concept_id = $cid;
        $thLabel->language_id = $langId;
        $thLabel->concept_label_type = $type;
        $thLabel->user_id = $user->id;
        $thLabel->save();

        $thLabel->language;

        return response()->json($thLabel, 201);
    }

    public function addNote(Request $request) {
        $user = \Auth::user();
        if(!$user->can('edit_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'content' => 'required|string',
            'lid' => 'required|integer|exists:th_language,id',
            'cid' => 'required|integer',
            'tree_name' => 'nullable|string',
        ]);

        $label = $request->get('content');
        $langId = $request->get('lid');
        $cid = $request->get('cid');
        $treeName = $request->get('tree_name');

        try {
            if($treeName === 'sandbox') {
                ThConceptSandbox::findOrFail($cid);
            } else {
                ThConcept::findOrFail($cid);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        if($treeName == 'sandbox') {
            $note = new ThConceptNoteSandbox();
        } else {
            $note = new ThConceptNote();
        }

        $note->content = $label;
        $note->concept_id = $cid;
        $note->language_id = $langId;
        $note->save();

        $note->language;

        return response()->json($note, 201);
    }

    public function addBroader(Request $request, $id, $bid) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', '');
        $addAsRoot = $bid === -1;

        $concept;
        try {
            if($treeName === 'sandbox') {
                $concept = ThConceptSandbox::findOrFail($id);
            } else {
                $concept = ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }
        if(!$addAsRoot) {
            try {
                if($treeName === 'sandbox') {
                    ThConceptSandbox::findOrFail($bid);
                } else {
                    ThConcept::findOrFail($bid);
                }
            } catch(ModelNotFoundException $e) {
                return response()->json([
                    'error' => 'This concept does not exist'
                ], 400);
            }
        }

        $broaderQuery = th_broader_builder($treeName);
        $relationExists = $broaderQuery->where('broader_id', $bid)
            ->where('narrower_id', $id)
            ->exists();
        if($relationExists) {
            return response()->json([
                'error' => 'This relation already exists'
            ], 400);
        }

        DB::beginTransaction();

        $entry;
        if($addAsRoot) {
            $concept->is_top_concept = true;
            $concept->save();
        } else {
            if($treeName == 'sandbox') {
                $entry = new ThBroaderSandbox();
            } else {
                $entry = new ThBroader();
            }

            $entry->broader_id = $bid;
            $entry->narrower_id = $id;
            $entry->save();
        }

        // check circles
        $circles = th_detect_circles();

        if(count($circles) > 0) {
            DB::rollBack();
            return response()->json([
                'error' => 'Can not add this concept, would result in a circle.'
            ], 400);
        }

        DB::commit();

        return response()->json($entry, 201);
    }

    public function removeBroader(Request $request, $id, $bid) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', '');

        $concept;
        try {
            if($treeName === 'sandbox') {
                $concept = ThConceptSandbox::findOrFail($id);
            } else {
                $concept = ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }
        if($bid != -1) {
            try {
                if($treeName === 'sandbox') {
                    ThConceptSandbox::findOrFail($bid);
                } else {
                    ThConcept::findOrFail($bid);
                }
            } catch(ModelNotFoundException $e) {
                return response()->json([
                    'error' => 'This concept does not exist'
                ], 400);
            }
        }

        if($bid != -1) {
            $query;
            if($treeName == 'sandbox') {
                $query = ThBroaderSandbox::query();
            } else {
                $query = ThBroader::query();
            }

            $query->where('broader_id', $bid)
            ->where('narrower_id', $id)
            ->delete();
        } else {
            $concept->is_top_concept = false;
            $concept->save();
        }

        // if narrower is not a top concept
        // check if there are other broader-narrower
        // relations. If not, delete the concept
        if(!$concept->is_top_concept) {
            if($treeName == 'sandbox') {
                $query = ThBroaderSandbox::query();
            } else {
                $query = ThBroader::query();
            }

            $broadCnt = $query->where('narrower_id', $id)->count();

            if($broadCnt === 0) {
                $broaderTable = th_broader_builder($treeName);

                $narrowers = $broaderTable->where('broader_id', $id)->pluck('narrower_id')->toArray();

                $concept->delete();

                self::deleteOrphanedConcepts($narrowers, $treeName);
            }
        }

        return response()->json(null, 204);
    }

    public function deleteElementCascade(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('delete_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', '');
        try {
            if($treeName === 'sandbox') {
                ThConceptSandbox::findOrFail($id);
            } else {
                ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        $conceptTable = th_tree_builder($treeName);
        $broaderTable = th_broader_builder($treeName);

        $narrowers = $broaderTable->where('broader_id', $id)->pluck('narrower_id')->toArray();

        $conceptTable
            ->where('id', $id)
            ->delete();

        self::deleteOrphanedConcepts($narrowers, $treeName);

        return response()->json(null, 204);
    }

    public function deleteElementOneUp(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('delete_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $treeName = $request->query('t', '');

        $suffix = '';
        if($treeName === 'sandbox') {
            $suffix = '_master';
        }
        $thConcept = "th_concept$suffix";
        $thBroader = "th_broaders$suffix";

        $narrowers = DB::table($thBroader)
            ->where('broader_id', $id)
            ->get();

        $broader_ids = DB::table($thBroader)
            ->where('narrower_id', $id)
            ->get();

        // deleted element has no broaders, set children as top concept
        if(!isset($broader_ids) || $broader_ids->isEmpty()) {
            $nIds = $narrowers->pluck('narrower_id')->toArray();
            DB::table($thConcept)
                ->whereIn('id', $nIds)
                ->update([
                    'is_top_concept' => true
                ]);
        } else {
            foreach($broader_ids as $b) {
                foreach($narrowers as $n) {
                    $broaderEntry;
                    if($treeName === 'sandbox') {
                        $broaderEntry = new ThBroaderSandbox();
                    } else {
                        $broaderEntry = new ThBroader();
                    }
                    $broaderEntry->broader_id = $b->broader_id;
                    $broaderEntry->narrower_id = $n->narrower_id;
                    $broaderEntry->save();
                }
            }
        }
        DB::table($thConcept)
            ->where('id', $id)
            ->delete();

        return response()->json(null, 204);
    }

    private static function deleteOrphanedConcepts($descs, $tree) {
        $conceptTable = th_tree_builder($tree);
        $uniqueDescs = $conceptTable
            ->whereIn('id', $descs)
            ->where('is_top_concept', false)
            ->doesntHave('broaders')
            ->get();
        $descsArray = $uniqueDescs->pluck('id')->toArray();
        $conceptTable = th_tree_builder($tree);
        $conceptTable->whereIn('id', $descsArray)->delete();

        foreach($descsArray as $descId) {
            $broaderTable = th_broader_builder($tree);
            $narrowers = $broaderTable->where('broader_id', $descId)->pluck('narrower_id')->toArray();
            self::deleteOrphanedConcepts($narrowers, $tree);
        }
    }

    public function import(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'file' => 'required|file',
            'type' => 'upload_type'
        ]);

        $treeName = $request->query('t', '');
        $file = $request->file('file');
        $type = $request->input('type', 'extend');
        $suffix = $treeName === 'sandbox' ? '_master' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        DB::beginTransaction();

        if($type == 'replace') {
            DB::table($thConcept)
                ->delete();
        }

        $languages = ThLanguage::all()->keyBy('short_name');

        $graph = new Graph();
        $graph->parseFile($file->getRealPath());
        $resources = $graph->resources();
        $relations = [];
        foreach($resources as $url => $r) {
            // Skip resources that are not concepts
            if(!$r->isA('skos:Concept')) {
                continue;
            }
            $concept = DB::table($thConcept)
                ->where('concept_url', $url)
                ->first();
            $conceptExists = $concept !== null;
            //if type = extend we only want to add new concepts (count = 0)
            if($type == 'extend' && $conceptExists) continue;

            $isTopConcept = count($r->allResources('skos:topConceptOf')) > 0;
            if(!$isTopConcept) {
                $isTopConcept =
                    count($r->allResources('skos:broader')) === 0 &&
                    count($r->allResources('skos:broaderTransitive')) === 0;
            }
            $scheme = '';
            $user_id = $user->id;

            $needsUpdate = $type == 'update-extend' && $conceptExists;
            if($needsUpdate) {
                $cid = $concept->id;
            } else {
                $cid = DB::table($thConcept)
                    ->insertGetId([
                    'concept_url' => $url,
                    'concept_scheme' => $scheme,
                    'is_top_concept' => $isTopConcept,
                    'user_id' => $user_id
                ]);
            }

            $prefLabels = $r->allLiterals('skos:prefLabel');
            foreach($prefLabels as $pL) {
                $lang = $languages[$pL->getLang()];
                if(!isset($lang)) {
                    \Log::info("Language $pL->getLang() is missing. Skipping entry.");
                    continue;
                }
                $lid = $lang->id;
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
                                'user_id' => $user_id
                            ]);
                    } else {
                        DB::table($thLabel)
                            ->insert([
                                'user_id' => $user_id,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 1
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'user_id' => $user_id,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 1
                    ]);
                }
            }

            $altLabels = $r->allLiterals('skos:altLabel');
            foreach($altLabels as $aL) {
                $lang = $languages[$aL->getLang()];
                if(!isset($lang)) {
                    \Log::info("Language $aL->getLang() is missing. Skipping entry.");
                    continue;
                }
                $lid = $lang->id;
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
                                'user_id' => $user_id,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 2
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'user_id' => $user_id,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 2
                    ]);
                }
            }

            $broaders = array_merge($r->allResources('skos:broader'), $r->allResources('skos:broaderTransitive'));
            foreach($broaders as $broader) {
                $relations[] = [
                    'broader' => $broader->getUri(),
                    'narrower' => $url
                ];
            }

            $narrowers = array_merge($r->allResources('skos:narrower'), $r->allResources('skos:narrowerTransitive'));
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
                ->where('concept_url', $b)
                ->value('id');
            $nid = DB::table($thConcept)
                ->where('concept_url', $n)
                ->value('id');
            if(!isset($bid) || !isset($nid)) {
                continue;
            }
            $relationExists = DB::table($thBroader)
                ->where([
                    ['broader_id', '=', $bid],
                    ['narrower_id', '=', $nid]
                ])
                ->exists();
            if(!$relationExists) {
                DB::table($thBroader)
                    ->insert([
                        'broader_id' => $bid,
                        'narrower_id' => $nid
                ]);
            }
        }

        // check circles
        $circles = th_detect_circles();

        if(count($circles) > 0) {
            $circleList = '';
            foreach($circles as $circle) {
                $broader_concept = Db::table($thConcept)->where('id', $circle->bid)->first();
                $circleList .= "$broader_concept->concept_url\n";
            }
            DB::rollBack();
            return response()->json([
                'error' => "Your imported tree has circles for the following concepts:\n\n$circleList\n\nPlease fix and re-upload."
            ], 400);
        }

        DB::commit();

        return response()->json(null, 204);
    }

    public function patchLabel(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('delete_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'label' => 'required|string'
        ]);

        $which = $request->query('t', '');
        $label;

        try {
            if($which === 'sandbox') {
                $label = ThConceptLabelSandbox::findOrFail($id);
            } else {
                $label = ThConceptLabel::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This label does not exist'
            ], 400);
        }

        $label->label = $request->get('label');
        $label->save();

        return response()->json($label);
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
                        if($con == $concept->id) {
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

    public function copy(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
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
            $thConceptSrc = $thConcept;
            $thLabelSrc = $thLabel;
            $thBroaderSrc = $thBroader;
            $thConcept .= '_master';
            $thLabel .= '_master';
            $thBroader .= '_master';
            $labelView = 'getFirstLabelForLanguagesFromMaster';
        } else {
            $thConceptSrc = $thConcept . '_master';
            $thLabelSrc = $thLabel . '_master';
            $thBroaderSrc = $thBroader . '_master';
            $labelView = 'getFirstLabelForLanguagesFromProject';
        }

        $rows = DB::select("
        WITH RECURSIVE
        q(id, concept_url, concept_scheme, user_id, is_top_concept, created_at, updated_at, broader_id, lvl) AS
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
            else $row->is_top_concept = false;
            $conceptAlreadyExists = false;
            $newId = DB::table($thConcept)
                ->where('concept_url', '=', $row->concept_url)
                ->value('id');
            if($newId === null) {
                if($src == 'project') $currentConcept = new ThConcept();
                else $currentConcept = new ThConceptProject();
                $currentConcept->concept_url = $row->concept_url;
                $currentConcept->concept_scheme = $row->concept_scheme;
                $currentConcept->user_id = $user->id;
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
                else $currentLabel = new ThConceptLabelSandbox();
                $currentLabel->user_id = $user->id;
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
            q(id, concept_url, concept_scheme, user_id, is_top_concept, created_at, updated_at, label, broader_id, reclevel) AS
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
                if($c->broader_id == -1) continue;
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
        $user = \Auth::user();
        if(!$user->can('add_move_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $narrow = $request->get('narrower_id');
        $oldBroader = $request->get('old_broader_id');
        $broader = $request->get('broader_id');
        $lang = $request->get('lang');
        $treeName = $request->get('treeName');

        if($treeName === 'project') {
            $suffix = '';
        } else {
            $suffix = '_master';
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

        return response()->json([
            'concepts' => [],
            'conceptNames' => []
        ]);
    }

    private static function cloneConceptTree($srcId, $tgtBroaderId, $srcTree, $tgtTree, $user) {
        $srcConcept;
        $broaderConcept;
        $clonedConcept;
        $alreadyExists = true;
        if($srcTree === 'sandbox') {
            $srcConcept = ThConceptSandbox::findOrFail($srcId);
            if($tgtBroaderId !== -1) {
                $broaderConcept = ThConcept::findOrFail($tgtBroaderId);
            }
            // Check if url of source concept already exists in target tree
            // If not, create a new one
            $clonedConcept = ThConcept::where('concept_url', $srcConcept->concept_url)->first();
            if(!isset($clonedConcept)) {
                $clonedConcept = new ThConcept();
                $alreadyExists = false;
            }
        } else {
            $srcConcept = ThConcept::findOrFail($srcId);
            if($tgtBroaderId !== -1) {
                $broaderConcept = ThConceptSandbox::findOrFail($tgtBroaderId);
            }
            // Check if url of source concept already exists in target tree
            // If not, create a new one
            $clonedConcept = ThConceptSandbox::where('concept_url', $srcConcept->concept_url)->first();
            if(!isset($clonedConcept)) {
                $clonedConcept = new ThConceptSandbox();
                $alreadyExists = false;
            }
        }

        if(!$alreadyExists) {
            $clonedConcept->fill($srcConcept->getAttributes());
        }
        $clonedConcept->is_top_concept = $tgtBroaderId === -1;
        $clonedConcept->save();

        if(!$clonedConcept->is_top_concept) {
            $relation;
            if($srcTree === 'sandbox') {
                $relation = new ThBroader();
            } else {
                $relation = new ThBroaderSandbox();
            }
            $relation->broader_id = $tgtBroaderId;
            $relation->narrower_id = $clonedConcept->id;
            $relation->save();
        }

        $srcLabels = $srcConcept->labels;
        $srcNotes = $srcConcept->notes;

        foreach($srcLabels as $label) {
            $attrs = [
                'label' => $label->label,
                'concept_id' => $clonedConcept->id,
                'language_id' => $label->language_id
            ];
            $newAttrs = [
                'user_id' => $user->id
            ];
            if($srcTree === 'sandbox') {
                ThConceptLabel::firstOrCreate($attrs, $newAttrs);
            } else {
                ThConceptLabelSandbox::firstOrCreate($attrs, $newAttrs);
            }
        }
        foreach($srcNotes as $note) {
            $attrs = [
                'content' => $note->content,
                'concept_id' => $clonedConcept->id,
                'language_id' => $note->language_id
            ];
            if($srcTree === 'sandbox') {
                ThConceptNote::firstOrCreate($attrs);
            } else {
                ThConceptNoteSandbox::firstOrCreate($attrs);
            }
        }

        $relations;
        if($srcTree === 'sandbox') {
            $relations = ThBroaderSandbox::where('broader_id', $srcConcept->id)->get();
        } else {
            $relations = ThBroader::where('broader_id', $srcConcept->id)->get();
        }

        foreach($relations as $relation) {
            self::cloneConceptTree($relation->narrower_id, $clonedConcept->id, $srcTree, $tgtTree, $user);
        }

        return $clonedConcept;
    }
}
