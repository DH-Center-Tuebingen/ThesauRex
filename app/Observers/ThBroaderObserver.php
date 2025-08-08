<?php

namespace App\Observers;

use App\ThBroaderBase;
use App\Events\RelationCreated;
use App\Events\RelationDeleted;
use Illuminate\Broadcasting\BroadcastException;

class ThBroaderObserver {
    /**
     * Handle the ThBroaderBase "saved" event.
     */
    public function saved(ThBroaderBase $relation): void {
        $relationClass = get_class($relation);
        $tree = $relationClass == 'App\\ThBroaderSandbox' ? 'sandbox' : 'project';
        try {
            $user = auth()->user();
            /**
             * We always create a new relation, so we don't need to use the relation updated separately.
             */
            broadcast(new RelationCreated($relation, $tree, $user))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling saved() event in ThBroaderObserver: " . $e->getMessage());
        }
    }

    /**
     * Handle the ThBroaderBase "deleting" event.
     */
    public function deleting(ThBroaderBase $relation): void {
        $relationClass = get_class($relation);
        $tree = $relationClass == 'App\\ThBroaderSandbox' ? 'sandbox' : 'project';
        try {
            broadcast(new RelationDeleted($relation, $tree, auth()->user()))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling deleting() event in ThBroaderObserver: " . $e->getMessage());
        }
    }
}
