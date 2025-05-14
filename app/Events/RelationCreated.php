<?php

namespace App\Events;

use App\ThBroaderBase;
use App\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RelationCreated implements ShouldBroadcast {
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public ThBroaderBase $relation,
        public string $tree,
        public User $user
    ) {
        $this->relation = $relation;        
        $this->tree = $tree;
        $this->user = $user;
    }
    
    public function broadcastWith(){
        
        /**
         * When creating a new relation, the other client may not
         * have the relation loaded yet. So we need to pass those 
         * concepts, that the client can add them to it's store.
         */
        
        $this->relation->load('broader', 'narrower');    
        $this->relation->broader?->load('labels.language');
        $this->relation->narrower?->load('labels.language');
        
        $this->relation->broader?->setAppends(['parents', 'path', 'broaders_count']);
        $this->relation->narrower?->setAppends(['parents', 'path', 'broaders_count']);
        
        return [
            'relation' => $this->relation->toArray(),
            'tree' => $this->tree,
            'user' => $this->user->toArray(),  
        ]; 
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array {
        return [
            new PrivateChannel('channel.system'),
        ];
    }
}
