<?php

namespace App\Observers;

use App\ThConceptLabelBase;
use App\Events\LabelCreated;
use App\Events\LabelDeleted;
use App\Events\LabelUpdated;
use Illuminate\Broadcasting\BroadcastException;

class ThConceptLabelObserver {
    /**
     * Handle the ThConceptLabelBase "saved" event.
     */
    public function saved(ThConceptLabelBase $label): void {
        $labelClass = get_class($label);
        $tree = $labelClass == 'App\\ThConceptLabelSandbox' ? 'sandbox' : 'project';
        try {
            $user = auth()->user();
            $label->load('language');
            if($label->wasRecentlyCreated) {
                broadcast(new LabelCreated($label, $tree, $user))->toOthers();
            } else {
                $oldLabelData = $label->getOriginal();
                broadcast(new LabelUpdated($label, $oldLabelData['label'], $tree, $user))->toOthers();
            }
        } catch(BroadcastException $e) {
            info("BroadcastException while handling saved() event in ThConceptLabelObserver: " . $e->getMessage());
        }
    }

    /**
     * Handle the ThConceptLabelBase "deleting" event.
     */
    public function deleting(ThConceptLabelBase $label): void {
        $labelClass = get_class($label);
        $tree = $labelClass == 'App\\ThConceptLabelSandbox' ? 'sandbox' : 'project';
        try {
            $label->load('language');
            broadcast(new LabelDeleted($label, $tree, auth()->user()))->toOthers();
        } catch(BroadcastException $e) {
            info("BroadcastException while handling deleting() event in ThConceptLabelObserver: " . $e->getMessage());
        }
    }
}
