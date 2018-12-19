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
        if(!$user->can('view_concepts_th')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $q = $request->query('q');
        $tree = $request->query('t');

        $langCode = Preference::getUserPreference($user->id, 'prefs.gui-language')->value;

        $builder = Helpers::getTreeBuilder($tree, $langCode);

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
            ->get();

        $foreignConcepts = Helpers::getTreeBuilder($tree, $langCode)
            ->whereDoesntHave('labels', function($query) use ($language) {
                $query->where('language_id', $language->id);
            })
            ->whereHas('labels', function($query) use ($q) {
                $query->where('label', 'ilike', "%$q%");
            })
            ->get();

        $concepts = $concepts->union($foreignConcepts);

        $concepts->each->setAppends(['parents', 'path']);

        return response()->json($concepts);
    }
}
