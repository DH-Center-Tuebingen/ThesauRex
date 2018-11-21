<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function searchConcepts(Request $request) {
        // $user = \Auth::user();
        // if(!$user->can('view_concepts_th')) {
        //     return response([
        //         'error' => 'You do not have the permission to call this method'
        //     ], 403);
        // }

        $q = $request->query('q');

        return response()->json();
    }
}
