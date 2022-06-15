<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1')->group(function() {
    Route::get('/pre', 'HomeController@getGlobalData');
    Route::get('/version', function() {
        $versionInfo = new App\VersionInfo();
        return response()->json([
            'full' => $versionInfo->getFullRelease(),
            'readable' => $versionInfo->getReadableRelease(),
            'release' => $versionInfo->getRelease(),
            'name' => $versionInfo->getReleaseName(),
            'time' => $versionInfo->getTime()
        ]);
    });
});

// USER
Route::post('/v1/auth/login', 'UserController@login');

Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1')->group(function() {
    Route::get('/auth/refresh', 'UserController@refreshToken');
    Route::get('/auth/user', 'UserController@getUser');
    Route::get('/user', 'UserController@getUsers');
    Route::get('/role', 'UserController@getRoles');
    Route::get('/access/groups', 'UserController@getAccessGroups');

    Route::post('/user', 'UserController@addUser');
    Route::post('/user/avatar', 'UserController@addAvatar')->where('id', '[0-9]+');
    Route::post('/user/reset/password', 'Auth\\ForgotPasswordController@sendResetLinkEmail');
    Route::post('/role', 'UserController@addRole');
    Route::post('/auth/logout', 'UserController@logout');

    Route::patch('/user/{id}', 'UserController@patchUser');
    Route::patch('/user/restore/{id}', 'UserController@restoreUser');
    Route::patch('/role/{id}', 'UserController@patchRole');

    Route::delete('/user/{id}', 'UserController@deleteUser')->where('id', '[0-9]+');
    Route::delete('/role/{id}', 'UserController@deleteRole')->where('id', '[0-9]+');
    Route::delete('/user/avatar', 'UserController@deleteAvatar')->where('id', '[0-9]+');
});

// TREE
Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1/tree')->group(function() {
    Route::get('/', 'TreeController@getTree');
    Route::get('/byParent/{id}', 'TreeController@getDescendants')->where('id', '[0-9]+');
    Route::get('/{id}', 'TreeController@getConcept')->where('id', '[0-9]+');
    Route::get('/{id}/parentIds', 'TreeController@getParentIds')->where('id', '[0-9]+');
    Route::get('/export', 'TreeController@export');
    Route::get('/export/{id}', 'TreeController@export')->where('id', '[0-9]+');

    Route::post('/', 'TreeController@import');

    Route::patch('/label/{id}', 'TreeController@patchLabel')->where('id', '[0-9]+');
    Route::patch('/note/{id}', 'TreeController@patchNote')->where('id', '[0-9]+');

    Route::put('/concept', 'TreeController@addConcept');
    Route::put('/concept/clone/{id}/to/{bid}', 'TreeController@cloneConceptFromTree')->where('id', '[0-9]+')->where('bid', '-?[0-9]+');
    Route::put('/label', 'TreeController@addLabel');
    Route::put('/note', 'TreeController@addNote');
    Route::put('/concept/{id}/broader/{bid}', 'TreeController@addBroader')->where('id', '[0-9]+')->where('bid', '[0-9]+');

    Route::delete('/concept/{id}', 'TreeController@deleteElementCascade')->where('id', '[0-9]+');
    Route::delete('/concept/{id}/move', 'TreeController@deleteElementOneUp')->where('id', '[0-9]+');
    Route::delete('/label/{id}', 'TreeController@deleteLabel')->where('id', '[0-9]+');
    Route::delete('/note/{id}', 'TreeController@deleteNote')->where('id', '[0-9]+');
    Route::delete('/concept/{id}/broader/{bid}', 'TreeController@removeBroader')->where('id', '[0-9]+')->where('bid', '-?[0-9]+');
});

// LANGUAGE
Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1/language')->group(function() {
    Route::get('', 'LanguageController@getLanguages');

    Route::post('', 'LanguageController@addLanguage');

    Route::delete('/{id}', 'LanguageController@deleteLanguage')->where('id', '[0-9]+');
});

// PREFERENCES
Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1/preference')->group(function() {
    Route::get('', 'PreferenceController@getPreferences');
    Route::get('/{id}', 'PreferenceController@getUserPreferences')->where('id', '[0-9]+');

    Route::patch('/', 'PreferenceController@patchPreferences');
    Route::patch('/{uid}', 'PreferenceController@patchPreferences')->where('uid', '[0-9]+');
});

// SEARCH
Route::middleware(['before' => 'jwt.auth', 'after' => 'jwt.refresh'])->prefix('v1/search')->group(function() {
    Route::get('/concept', 'SearchController@searchConcepts');
});
