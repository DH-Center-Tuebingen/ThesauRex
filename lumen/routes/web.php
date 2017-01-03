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
$app->get('get/languages', 'TreeController@getLanguages');
$app->post('import', 'TreeController@import');
$app->post('export', 'TreeController@export');
$app->post('get/relations', 'TreeController@getRelations');
$app->post('remove/concept', 'TreeController@removeConcept');
$app->post('delete/cascade', 'TreeController@deleteElementCascade');
$app->post('delete/oneup', 'TreeController@deleteElementOneUp');
$app->post('delete/totop', 'TreeController@deleteElementToTop');
$app->post('get/tree', 'TreeController@getTree');
$app->post('get/label', 'TreeController@getLabels');
$app->post('add/broader', 'TreeController@addBroader');
$app->post('add/concept', 'TreeController@addConcept');
$app->post('add/label', 'TreeController@addLabel');
$app->post('copy', 'TreeController@copy');
$app->post('update/relation', 'TreeController@updateRelation');
$app->post('search', 'TreeController@search');
$app->post('get/parents/all', 'TreeController@getAllParents');
