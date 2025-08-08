<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'HomeController@index')->name('home');

// FILES 
Route::middleware('auth:sanctum')->prefix('download')->group(function() {
    Route::get('/avatars/{filename}', 'AvatarController@download');
});

Auth::routes(["middleware" => ["auth:sanctum"]]);
