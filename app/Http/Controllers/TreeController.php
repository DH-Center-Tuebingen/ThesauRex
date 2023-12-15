<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use EasyRdf\Graph;
use EasyRdf\Serialiser\RdfXml;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TreeController extends Controller
{
    public const importTypes = ['extend', 'update_extend', 'replace'];

    public function getTree(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_read')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', 'project');
        $lang = $user->getLanguage();

        $conceptTable = th_tree_builder($which, $lang, 2);

        $topConcepts = $conceptTable
            ->withCount('narrowers as children_count')
            ->where('is_top_concept', true)
            ->get();
        $topConcepts->each->setAppends(['parents', 'path']);
        return response()->json($topConcepts);
    }

    public function getDescendants(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_read')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', 'project');
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

        $conceptTable = th_tree_builder($which, $lang, 2);

        $concepts = $conceptTable
            ->with(['broaders.labels.language', 'narrowers.labels.language'])
            ->withCount('narrowers as children_count')
            ->whereHas('broaders', function($query) use ($id) {
                $query->where('broader_id', $id);
            })
            ->get();

        $concepts->each->setAppends(['path']);
        return response()->json($concepts);
    }

    public function getConcept(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_read')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', 'project');
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

    public function getParentIds(Request $request, $id) {
        $user = auth()->user();
        if(!$user->can('thesaurus_read')) {
            return response()->json([
                'error' => __('You do not have the permission to get an concept\'s parent id\'s')
            ], 403);
        }

        $which = $request->query('t', 'project');

        try {
            if($which == 'sandbox') {
                $concept = ThConceptSandbox::findOrFail($id);
            } else {
                $concept = ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This concept does not exist')
            ], 400);
        }
        // return response()->json($concept->parentIds());
        return response()->json($concept->path);
    }

    public function export(Request $request, $id = null) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_share')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', 'project');
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
        return response()->download(Storage::path($file))->deleteFileAfterSend(true);
    }

    public function addConcept(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_create')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', 'project');
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
        $thConcept->broaders->loadMissing('labels.language');
        $thConcept->narrowers->loadMissing('labels.language');
        $thConcept->setAppends(['parents', 'path']);

        return response()->json($thConcept, 201);
    }

    public function cloneConceptFromTree(Request $request, $id, $bid) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_create')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $target = $request->query('t', 'project');
        $from = $request->query('s', 'project');

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
        $clonedConcept->broaders->loadMissing('labels.language');
        $clonedConcept->narrowers->loadMissing('labels.language');
        $clonedConcept->setAppends(['parents', 'path']);

        return response()->json($clonedConcept, 201);
    }

    public function deleteLabel(Request $request, $id) {
        $user = \Auth::user();

        if(!$user->can('thesaurus_delete')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->get('t');

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

        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->get('t');

        $noteTable = th_note_builder($treeName);

        $noteTable
            ->where('id', $id)
            ->delete();

        return response()->json(null, 204);
    }

    public function addLabel(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'content' => 'required|string',
            'lid' => 'required|integer|exists:th_language,id',
            'cid' => 'required|integer',
            'tree_name' => 'required|string',
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
            $hasPrimaryLabel = ThConceptLabelSandbox::where($cond)->exists();
        } else {
            $thLabel = new ThConceptLabel();
            $hasPrimaryLabel = ThConceptLabel::where($cond)->exists();
        }
        $thLabel->label = $label;
        $thLabel->concept_id = $cid;
        $thLabel->language_id = $langId;
        // set label type based on existing labels
        $thLabel->concept_label_type = $hasPrimaryLabel ? 2 : 1;
        $thLabel->user_id = $user->id;
        $thLabel->save();

        $thLabel->language;

        return response()->json($thLabel, 201);
    }

    public function addNote(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'content' => 'required|string',
            'lid' => 'required|integer|exists:th_language,id',
            'cid' => 'required|integer',
            'tree_name' => 'required|string',
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
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', 'project');
        $addAsRoot = $bid === -1;

        try {
            if($treeName === 'sandbox') {
                $concept = ThConceptSandbox::findOrFail($id);
                $broaderTable = (new ThBroaderSandbox())->getTable();
            } else {
                $concept = ThConcept::findOrFail($id);
                $broaderTable = (new ThBroader())->getTable();
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
        $circles = th_detect_circles($broaderTable);

        if(count($circles) > 0) {
            DB::rollBack();
            return response()->json([
                'error' => 'Can not add this concept, as it would result in a circle.'
            ], 400);
        }

        DB::commit();

        return response()->json($entry, 201);
    }

    public function removeBroader(Request $request, $id, $bid) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', 'project');

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

        // if narrower is not a top concept
        // check if there are other broader-narrower
        // relations. If not, delete the concept
        if(!$concept->is_top_concept || $bid == -1) {
            if($treeName == 'sandbox') {
                $query = ThBroaderSandbox::query();
            } else {
                $query = ThBroader::query();
            }

            $broadCnt = $query->where('narrower_id', $id)->count();

            $cntForReject = $bid == -1 ? 0 : 1;

            if($broadCnt === $cntForReject) {
                return response()->json([
                    'error' => 'This concept is neither a top level concept nor does it have other broader concepts. Thus, removing this relation would result in deleting that concept. Please use the delete functionality to delete it.'
                ], 400);
            }
        }

        if($bid != -1) {
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

        return response()->json(null, 204);
    }

    public function deleteConcept(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_delete')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $treeName = $request->query('t', 'project');
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

        DB::beginTransaction();

        // actions are
        // 'cascade' => remove relation of all descendants (and delete if no other relation exists),
        // 'level' => move all descendants one level up (rerelate descendants to their "grandparent")
        // 'top' => make all descendants a top level concept
        // 'rerelate' => add concept given by query param 'p' as parent for descendants
        $action = $request->query('a', 'cascade');

        $conceptTable = th_tree_builder($treeName);
        $broaderTable = th_broader_builder($treeName);

        $broaders = $broaderTable->where('narrower_id', $id)->pluck('broader_id')->toArray();
        $narrowers = $broaderTable->where('broader_id', $id)->pluck('narrower_id')->toArray();

        switch($action) {
            case 'cascade':
                $concept->delete();
                self::deleteOrphanedConcepts($narrowers, $treeName);
                break;
            case 'level':
                if($concept->is_top_concept) {
                    $conceptTable
                        ->whereIn('id', $narrowers)
                        ->update(['is_top_concept' => true]);
                }
                $concept->delete();
                foreach($broaders as $broaderId) {
                    foreach($narrowers as $narrowerId) {
                        $broaderTable = th_broader_builder($treeName);
                        $exists = $broaderTable
                            ->where('broader_id', $broaderId)
                            ->where('narrower_id', $narrowerId)
                            ->exists();
                        if(!$exists) {
                            if($treeName === 'sandbox') {
                                $broaderRelation = new ThBroaderSandbox();
                            } else {
                                $broaderRelation = new ThBroader();
                            }

                            $broaderRelation->broader_id = $broaderId;
                            $broaderRelation->narrower_id = $narrowerId;
                            $broaderRelation->save();
                        }
                    }
                }
                break;
            case 'top':
                $concept->delete();
                $conceptTable
                    ->whereIn('id', $narrowers)
                    ->update(['is_top_concept' => true]);
                break;
            case 'rerelate':
                $newParentId = $request->query('p');
                if(!isset($newParentId)) {
                    DB::rollback();
                    return response()->json([
                        'error' => 'No new parent provided! When using \'rerelate\' mode, you have to provide a new parent concept.'
                    ], 400);
                }
                try {
                    if($treeName === 'sandbox') {
                        ThConceptSandbox::findOrFail($newParentId);
                    } else {
                        ThConcept::findOrFail($newParentId);
                    }
                } catch(ModelNotFoundException $e) {
                    DB::rollback();
                    return response()->json([
                        'error' => 'This concept does not exist'
                    ], 400);
                }
                $concept->delete();
                foreach($narrowers as $narrowerId) {
                    $broaderTable = th_broader_builder($treeName);
                    $exists = $broaderTable
                        ->where('broader_id', $newParentId)
                        ->where('narrower_id', $narrowerId)
                        ->exists();
                    if(!$exists) {
                        if($treeName === 'sandbox') {
                            $broaderRelation = new ThBroaderSandbox();
                        } else {
                            $broaderRelation = new ThBroader();
                        }

                        $broaderRelation->broader_id = $newParentId;
                        $broaderRelation->narrower_id = $narrowerId;
                        $broaderRelation->save();
                    }
                }
                break;
        }

        DB::commit();

        return response()->json(null, 204);
    }

    private static function deleteOrphanedConcepts($descs, $tree) {
        if(count($descs) == 0) return;

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
        if(!$user->can('thesaurus_create') || !$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'file' => 'required|file',
            'type' => 'upload_type'
        ]);

        $treeName = $request->query('t', 'project');
        $file = $request->file('file');
        $type = $request->input('type', 'extend');
        $suffix = $treeName === 'sandbox' ? '_master' : '';

        $thConcept = 'th_concept' . $suffix;
        $thLabel = 'th_concept_label' . $suffix;
        $thBroader = 'th_broaders' . $suffix;

        $importConfig = Preference::getUserPreference($user->id, 'prefs.import-config')['value'];

        $ignoreLabels = $importConfig->ignore_missing_labels;
        $skipLabels = $importConfig->skip_missing_labels;
        $ignoreLanguages = $importConfig->ignore_missing_languages;
        $ignoreRelations = $importConfig->ignore_missing_relations;

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

        $ignores = [
            'labels' => 0,
            'languages' => 0,
            'relations' => 0,
        ];
        $skips = [
            'labels' => 0,
        ];
        foreach($resources as $url => $r) {
            // Skip resources that are not concepts
            if(!$r->isA('skos:Concept')) {
                continue;
            }
            $prefLabels = $r->allLiterals('skos:prefLabel');
            $altLabels = $r->allLiterals('skos:altLabel');
            $labelCnt = count($prefLabels) + count($altLabels);

            if($labelCnt == 0) {
                if($skipLabels) {
                    $skips['labels']++;
                    continue;
                } else if($ignoreLabels) {
                    $ignores['labels']++;
                } else {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Import aborted. Concept '$url' has no existing labels."
                    ], 400);
                }
            }

            $skippedLabels = 0;
            foreach($prefLabels as $pL) {
                if(!$languages->has($pL->getLang())) {
                    $skippedLabels++;
                }
            }
            foreach($altLabels as $aL) {
                if(!$languages->has($aL->getLang())) {
                    $skippedLabels++;
                }
            }

            if($labelCnt > 0 && $labelCnt == $skippedLabels) {
                if($skipLabels) {
                    $skips['labels']++;
                    continue;
                } else if($ignoreLabels) {
                    $ignores['labels']++;
                } else {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Import aborted. Concept '$url' has no existing labels due to skipping missing languages."
                    ], 400);
                }
            }

            $concept = DB::table($thConcept)
                ->where('concept_url', $url)
                ->first();
            $conceptExists = $concept !== null;
            //if type = extend we only want to add new concepts (count = 0)
            if($type == 'extend' && $conceptExists) continue;

            $isTopConcept = count($r->allResources('skos:topConceptOf')) > 0 || (count($r->allResources('skos:broader')) === 0 && count($r->allResources('skos:broaderTransitive')) === 0);
            $scheme = '';
            $user_id = $user->id;

            $needsUpdate = $type == 'update_extend' && $conceptExists;
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

            foreach($prefLabels as $pL) {
                if(!$languages->has($pL->getLang())) {
                    if($ignoreLanguages) {
                        $ignores['languages']++;
                        continue;
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'error' => "Import aborted. Language '{$pL->getLang()}' is missing in 'prefLabel' for entry '$url'."
                        ], 400);
                    }
                }
                $lang = $languages[$pL->getLang()];
                $lid = $lang->id;
                $label = $pL->getValue();
                if($needsUpdate) {
                    $where = [
                        ['concept_id', '=', $cid],
                        ['language_id', '=', $lid],
                        ['concept_label_type', '=', 1]
                    ];
                    $labelExists = DB::table($thLabel)
                        ->where($where)
                        ->exists();
                    if($labelExists) {
                        DB::table($thLabel)
                            ->where($where)
                            ->update([
                                'label' => $label,
                                'user_id' => $user_id,
                                'updated_at' => Carbon::now(),
                            ]);
                    } else {
                        DB::table($thLabel)
                            ->insert([
                                'user_id' => $user_id,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 1,
                                'updated_at' => Carbon::now(),
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'user_id' => $user_id,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 1,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now(),
                    ]);
                }
            }

            foreach($altLabels as $aL) {
                if(!$languages->has($aL->getLang())) {
                    if($ignoreLanguages) {
                        $ignores['languages']++;
                        continue;
                    } else {
                        DB::rollBack();
                        return response()->json([
                            'error' => "Import aborted. Language '{$aL->getLang()}' is missing in 'altLabel' for entry '$url'."
                        ], 400);
                    }
                }
                $lang = $languages[$aL->getLang()];
                $lid = $lang->id;
                $label = $aL->getValue();
                if($needsUpdate) {
                    $where = [
                        ['concept_id', '=', $cid],
                        ['language_id', '=', $lid],
                        ['label', '=', $label]
                    ];
                    $labelExists = DB::table($thLabel)
                        ->where($where)
                        ->exists();
                    if(!$labelExists) {
                        DB::table($thLabel)
                            ->insert([
                                'user_id' => $user_id,
                                'label' => $label,
                                'concept_id' => $cid,
                                'language_id' => $lid,
                                'concept_label_type' => 2,
                                'updated_at' => Carbon::now(),
                        ]);
                    }
                } else {
                    DB::table($thLabel)
                        ->insert([
                            'user_id' => $user_id,
                            'label' => $label,
                            'concept_id' => $cid,
                            'language_id' => $lid,
                            'concept_label_type' => 2,
                            'created_at' => Carbon::now(),
                            'updated_at' => Carbon::now(),
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
                if($ignoreRelations) {
                    $ignores['relations']++;
                    continue;
                } else {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Import aborted. Cannot set broader/narrower relation for '$b' (broader) and '$n' (narrower)."
                    ], 400);
                }
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
                        'narrower_id' => $nid,
                ]);
            }
        }

        // check circles
        $circles = th_detect_circles($thBroader);

        if(count($circles) > 0) {
            $circleList = '';
            foreach($circles as $circle) {
                $broader_concept = DB::table($thConcept)->where('id', $circle->bid)->first();
                $circleList .= "$broader_concept->concept_url\n";
            }
            DB::rollBack();
            return response()->json([
                'error' => "Import aborted. Your file contains circles for the following concepts:\n\n$circleList\n\nPlease fix and re-upload."
            ], 400);
        }

        DB::commit();

        return response()->json([
            'ignored_labels' => $ignores['labels'],
            'ignored_languages' => $ignores['languages'],
            'ignored_relations' => $ignores['relations'],
            'skipped_labels' => $skips['labels'],
        ]);
    }

    public function patchTopLevelState(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $which = $request->query('t', 'project');

        try {
            if($which === 'sandbox') {
                $concept = ThConceptSandbox::findOrFail($id);
            } else {
                $concept = ThConcept::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This concept does not exist'
            ], 400);
        }

        $concept->is_top_concept = !$concept->is_top_concept;
        $concept->save();

        return response()->json($concept);
    }

    public function patchLabel(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'label' => 'required|string'
        ]);

        $which = $request->query('t', 'project');

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

    public function patchNote(Request $request, $id) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_write')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'content' => 'required|string'
        ]);

        $which = $request->query('t', 'project');

        try {
            if($which === 'sandbox') {
                $note = ThConceptNoteSandbox::findOrFail($id);
            } else {
                $note = ThConceptNote::findOrFail($id);
            }
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This note does not exist'
            ], 400);
        }

        $note->content = $request->get('content');
        $note->save();

        return response()->json($note);
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
        if(!$user->can('thesaurus_write')) {
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
        if(!$user->can('thesaurus_write')) {
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
