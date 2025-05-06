<?php

namespace App\Console\Commands;

use App\Events\TestEvent;
use Illuminate\Console\Command;

class TestWebsocket extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-websocket {message : Message to send}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sends a message using a predefined Event (using a public and private channel) to test websocket functionality';

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

        TestEvent::dispatch($message);

        $this->info("Message \"$message\" successfully send to TestEvent!");
        return 0;
    }
}
