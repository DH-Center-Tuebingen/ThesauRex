<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Preference;
use App\ThLanguage;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SearchController extends Controller
{
    public function searchConcepts(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_read')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $q = $request->query('q');
        $tree = $request->query('t');
        $excludeList = json_decode($request->query('exc'));

        $langCode = Preference::getUserPreference($user->id, 'prefs.gui-language')->value;

        $builder = th_tree_builder($tree, $langCode);

        try {
            $language = ThLanguage::where('short_name', $langCode)->firstOrFail();
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Your language does not exist in ThesauRex'
            ], 400);
        }

        $concepts = $builder->whereHas('labels', function($query) use ($language, $q){
            $query->where('language_id', $language->id)
                ->where('label', 'ilike', "%$q%");
        })
            ->whereNotIn('id', $excludeList)
            ->get();

        $foreignConcepts = th_tree_builder($tree, $langCode)
            // ->whereDoesntHave('labels', function($query) use ($language) {
            //     $query->where('language_id', $language->id);
            // })
            ->whereHas('labels', function($query) use ($language, $q) {
                $query->whereNot('language_id', $language->id)
                    ->where('label', 'ilike', "%$q%");
            })
            ->whereNotIn('id', $excludeList)
            ->get();
        // info($concepts);
        // info($foreignConcepts);

        $concepts = $concepts->concat($foreignConcepts);

        $concepts->each->setAppends(['parents', 'path']);

        return response()->json($concepts);
    }
}
