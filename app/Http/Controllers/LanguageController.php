<?php

namespace App\Http\Controllers;
use App\ThLanguage;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class LanguageController extends Controller {
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct() {
        //
    }

    // GET
    public function getLanguages() {
        $user = \Auth::user();
        if(!$user->can('thesaurus_read')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        return response()->json(ThLanguage::all());
    }

    // POST
    public function addLanguage(Request $request) {
        $user = \Auth::user();
        if(!$user->can('thesaurus_create')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        $this->validate($request, [
            'display_name' => 'required|string',
            'short_name' => 'required|string|size:2'
        ]);

        $language = new ThLanguage();
        $language->display_name = $request->get('display_name');
        $language->short_name = $request->get('short_name');
        $language->user_id = $user->id;
        $language->save();

        return response()->json($language);
    }

    // PATCH

    // PUT

    // DELETE
    public function deleteLanguage(Request $request, $id) {
        $user = \Auth::user();

        if(!$user->can('thesaurus_delete')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }

        ThLanguage::where('id', $id)->delete();

        return response()->json(null, 204);
    }
}
