<?php

namespace Tests\Browser;

use Tests\DuskTestCase;
use Laravel\Dusk\Browser;

class BasicTest extends DuskTestCase
{
    public function testBasicBrowserConnection(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/')
                   ->pause(2000) // Wait 2 seconds
                   /** 
                   * Weirdly the seeder should set the correct title, but when this runs as the first test,
                   * the seeder seems to not have been run (except all other data is correct).
                   * But the preference that get's delivered is the default value..
                   */
                   ->assertTitle('ThesauRex - Spacialist');
        });
    }

    public function testLoginPageLoads(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/#/login')
                   ->pause(3000) // Wait for page to load
                   ->waitForText('Anmelden', 15)
                   ->assertSee('Anmelden');
        });
    }
}
