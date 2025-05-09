<?php

namespace App\Observers;

use App\ThLanguage;
use App\Events\LanguageCreated;
use App\Events\LanguageDeleted;
use App\Events\LanguageUpdated;
use Illuminate\Broadcasting\BroadcastException;

class ThLanguageObserver {
    /**
     * Handle the ThLanguage "saved" event.
     */
    public function saved(ThLanguage $language): void {
        try {
            $user = auth()->user();
            // User can be null if a seeder is used.
            if($user === null){
                return;
            }
            broadcast(new LanguageCreated($language, $user))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling saved() event in ThLanguageObserver: " . $e->getMessage());
        }
    }

    /**
     * Handle the ThLanguage "deleting" event.
     */
    public function deleting(ThLanguage $language): void {
        try {
            broadcast(new LanguageDeleted($language, auth()->user()))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling deleting() event in ThLanguageObserver: " . $e->getMessage());
        }
    }
}
