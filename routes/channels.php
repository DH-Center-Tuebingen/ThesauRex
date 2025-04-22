<?php

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

use App\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('channel.system', function (User $user) {
    // return true;
    return auth()->user()->id == $user->id;
});

Broadcast::channel('room.concept.{conceptId}', function (User $user, int $conceptId) {
    // TODO also check for $conceptId
    if($user->can('thesaurus_read')) {
        return [
            'id' => $user->id,
        ];
    }
});
