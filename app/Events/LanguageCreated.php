<?php

namespace App\Events;

use App\ThLanguage;
use App\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LanguageCreated implements ShouldBroadcast {
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public ThLanguage $language,
        public User $user
    ) {
        $this->language = $language;
        $this->user = $user;
    }

    public function broadcastWith(): array {
        return [
            'language' => $this->language->toArray(),
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
