<?php

namespace App\Observers;

use App\ThConceptBase;
use App\Events\ConceptCreated;
use App\Events\ConceptDeleted;
use App\Events\ConceptUpdated;
use Illuminate\Broadcasting\BroadcastException;

class ThConceptObserver {
    /**
     * Handle the ThConceptBase "saved" event.
     */
    public function saved(ThConceptBase $thConcept): void {
        $conceptClass = get_class($thConcept);
        $tree = $conceptClass == 'App\\ThConceptSandbox' ? 'sandbox' : 'project';
        try {
            $user = auth()->user();
            if($thConcept->wasRecentlyCreated) {
                broadcast(new ConceptCreated($thConcept, $tree, $user))->toOthers();
            } else {
                broadcast(new ConceptUpdated($thConcept, $tree, $user))->toOthers();
            }
        } catch(BroadcastException $e) {
            info("BroadcastException while handling saved() event in ThConceptObserver: " . $e->getMessage());
        }
    }

    /**
     * Handle the ThConceptBase "deleting" event.
     */
    public function deleting(ThConceptBase $thConcept): void {
        $conceptClass = get_class($thConcept);
        $tree = $conceptClass == 'App\\ThConceptSandbox' ? 'sandbox' : 'project';
        $thConcept->load('labels');
        try {
            broadcast(new ConceptDeleted($thConcept, $tree, auth()->user()))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling deleting() event in ThConceptObserver: " . $e->getMessage());
        }
    }
}
