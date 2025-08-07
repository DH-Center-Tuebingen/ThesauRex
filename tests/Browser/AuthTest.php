<?php

namespace Tests\Browser;

use Tests\DuskTestCase;
use Laravel\Dusk\Browser;
use App\User;

class AuthTest extends DuskTestCase
{
    public function testLoginFlow(): void
    {
        $this->browse(function (Browser $browser) {
            $admin = User::where('nickname', 'admin')->firstOrFail();
            
            $browser->visit('/#/login')
                   ->waitForText('Anmelden', 10)
                   ->type('email', $admin->email ?? 'admin@localhost')
                   ->type('password', 'admin')
                   ->press('Einloggen')
                   ->waitForText('Projekt-Baum', 15)
                   ->assertSee('Projekt-Baum');
        });
    }

    public function testFreshLoginMethod(): void
    {
        $this->browse(function (Browser $browser) {
            $admin = User::where('nickname', 'admin')->firstOrFail();
            
            // Test the freshLogin method
            $this->freshLogin($browser, $admin);
            
            // Should be logged in and see the main interface
            $browser->assertSee('Projekt-Baum');
        });
    }
}
