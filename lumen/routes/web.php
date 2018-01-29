<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$app->get('/', function () use ($app) {
    return $app->version();
});
$app->get('clear', function() use($app) {
    Illuminate\Support\Facades\Artisan::call('cache:clear');
});

$app->post('user/login', 'UserController@login');

$app->group(['middleware' => ['before' => 'jwt.auth', 'after' => 'jwt.refresh']], function($app) {
    $app->get('get/languages', 'TreeController@getLanguages');
    $app->get('user/delete/{id}', 'UserController@delete');
    $app->get('user/get/roles/all', 'UserController@getRoles');
    $app->get('user/get/roles/{id}', 'UserController@getRolesByUser');
    $app->get('user/get/role/permissions/{id}', 'UserController@getPermissionsByRole');
    $app->post('import', 'TreeController@import');
    $app->post('export', 'TreeController@export');
    $app->post('get/relations', 'TreeController@getRelations');
    $app->post('remove/concept', 'TreeController@removeConcept');
    $app->post('delete/cascade', 'TreeController@deleteElementCascade');
    $app->post('delete/oneup', 'TreeController@deleteElementOneUp');
    $app->post('delete/totop', 'TreeController@deleteElementToTop');
    $app->post('get/tree', 'TreeController@getTree');
    $app->post('get/label', 'TreeController@getLabels');
    $app->post('get/label/display', 'TreeController@getDisplayLabel');
    $app->post('get/notes', 'TreeController@getNotes');
    $app->post('remove/label', 'TreeController@removeLabel');
    $app->post('add/broader', 'TreeController@addBroader');
    $app->post('add/concept', 'TreeController@addConcept');
    $app->post('add/label', 'TreeController@addLabel');
    $app->post('copy', 'TreeController@copy');
    $app->post('update/relation', 'TreeController@updateRelation');
    $app->post('search', 'TreeController@search');
    $app->post('get/parents/all', 'TreeController@getAllParents');
    $app->post('user/logout', 'UserController@logout');
    $app->post('user/switch', 'UserController@switchRole');
    $app->post('user/get', 'UserController@get');
    $app->post('user/get/all', 'UserController@getAll');
    $app->post('user/add', 'UserController@add');
    $app->post('user/edit', 'UserController@edit');
    $app->post('user/add/role', 'UserController@addRoleToUser');
    $app->post('user/remove/role', 'UserController@removeRoleFromUser');
    $app->get('preference', 'UserController@getPreferences');
    $app->get('preference/{id:[0-9]+}', 'UserController@getUserPreferences');
    $app->patch('preference/{id:[0-9]+}', 'UserController@patchPreference');
});
