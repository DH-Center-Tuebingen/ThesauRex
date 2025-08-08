<?php

namespace App\Console\Commands;

use App\Events\SystemMessage as SystemMessageEvent;
use Illuminate\Console\Command;

class SystemMessage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:message {message : Message to send}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sends a live message via the websocket connection to all active clients.';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct() {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $message = $this->argument('message');
        SystemMessageEvent::dispatch($message);
        $this->info("Message \"$message\" successfully send to SystemMessageEvent!");
        return 0;
    }
}
