<?php

namespace App\Observers;

use App\ThConceptNoteBase;
use App\Events\NoteCreated;
use App\Events\NoteDeleted;
use App\Events\NoteUpdated;
use Illuminate\Broadcasting\BroadcastException;

class ThConceptNoteObserver {
    /**
     * Handle the ThConceptNoteBase "saved" event.
     */
    public function saved(ThConceptNoteBase $note): void {
        $noteClass = get_class($note);
        $tree = $noteClass == 'App\\ThConceptNoteSandbox' ? 'sandbox' : 'project';
        try {
            $user = auth()->user();
            $note->load('language');
            $note->load('concept');
            if($note->wasRecentlyCreated) {
                broadcast(new NoteCreated($note, $tree, $user))->toOthers();
            } else {
                broadcast(new NoteUpdated($note, $tree, $user))->toOthers();
            }
        } catch(BroadcastException $e) {
            info("BroadcastException while handling saved() event in ThConceptNoteObserver: " . $e->getMessage());
        }
    }

    /**
     * Handle the ThConceptNoteBase "deleting" event.
     */
    public function deleting(ThConceptNoteBase $note): void {
        $noteClass = get_class($note);
        $tree = $noteClass == 'App\\ThConceptNoteSandbox' ? 'sandbox' : 'project';
        try {
            $note->load('language');
            $note->load('concept');
            broadcast(new NoteDeleted($note, $tree, auth()->user()))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling deleting() event in ThConceptNoteObserver: " . $e->getMessage());
        }
    }
}
