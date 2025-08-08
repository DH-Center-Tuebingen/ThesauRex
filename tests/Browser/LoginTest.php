<?php

namespace Tests\Browser;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LoginTest extends DuskTestCase
{
    /**
     * Test that the application loads correctly.
     */
    public function testExample(): void
    {
        $this->browse(function (Browser $browser) {                    
            $browser->visit('/')
                    ->waitFor('#app', 10); // Wait for Vue to mount
        });
    }

    /**
     * Test that the login page is accessible.
     */
    public function testLoginPageAccessible(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/#/login')
                    ->waitFor('form', 10) // Wait for Vue to render login form
                    ->assertPresent('input#email')
                    ->assertPresent('input#password')
                    ->assertPresent('button[type="submit"]');
        });
    }
    
    public function testLoginFailsWithInvalidCredentials(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/#/login')
                    ->type('email', 'invalid@localhost')
                    ->type('password', 'wrongpassword')
                    ->press('Einloggen')
                    ->waitForText('Invalid Credentials', 10)
                    ->assertSee('Invalid Credentials')
                    ->assertPresent('input#email')
                    ->assertPresent('input#password');
        });
    }
    
    public function testLoginSucceedsWithValidCredentials(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/#/login')
                    ->type('email', 'admin@localhost')
                    ->type('password', 'admin')
                    ->press('Einloggen')
                    ->waitForText('Projekt-Baum', 10)
                    ->assertPathIs('/');
        });
    }
    
}
