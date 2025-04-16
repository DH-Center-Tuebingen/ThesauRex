<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Broadcast;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Broadcast::routes(["prefix" => "api", "middleware" => ["auth:sanctum"]]);
        Broadcast::routes(["middleware" => ["web"]]);

        require base_path('routes/channels.php');
    }
}
