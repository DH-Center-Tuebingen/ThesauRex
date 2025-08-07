<?php

namespace Tests\Browser;

use App\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LabelTest extends DuskTestCase
{
    
    public function testVisuals(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visitConcept(1, 'shape')
                ->assertSeeIn('.concept-detail .labels .btn-outline-secondary span:nth-child(2)', 'Deutsch')
                ->assertInputValue('.concept-detail .labels input', '')
                ->assertButtonDisabled('.labels .btn.btn-success')
                ->assertListOrder('.labels ul', ['shape', 'Form'], ".label-text")
                ->assertDataAttribute('.labels li:nth-child(1) .lang', 'lang', 'en')
                ->assertDataAttribute('.labels li:nth-child(2) .lang', 'lang', 'de');
        });
    }

    public function testAddLabel()
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visitConcept(1, 'shape')
                ->assertButtonDisabled('.labels .btn.btn-success')
                ->type('.labels input', 'forms')
                ->assertButtonEnabled('.labels .btn.btn-success')
                ->click('.labels .btn.btn-success')
                ->waitForTextIn('li:nth-child(3) .label-text', 'forms', self::wait)
                // Still visible after reload
                ->visitConcept(1, 'shape')
                ->waitForTextIn('li:nth-child(3) .label-text', 'forms', self::loadingWait);
        });
    }
    
    public function testEditLabel() {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $firstRowSelector = '.labels ul li:nth-child(1)'; 
            
            $browser->visitConcept(1, 'shape')
                ->assertMissing("$firstRowSelector .edit-button")
                ->assertMissing("$firstRowSelector input")
                ->mouseOver("$firstRowSelector .col:nth-child(1)")
                ->assertVisible("$firstRowSelector .edit-button")
                // Type & cancel update:
                ->click("$firstRowSelector .edit-button")
                ->assertInputValue("$firstRowSelector input", 'shape')
                ->assertButtonDisabled("$firstRowSelector .btn.btn-outline-success")
                ->assertButtonEnabled("$firstRowSelector .btn.btn-outline-danger")
                ->type("$firstRowSelector input", 'trash')
                ->click("$firstRowSelector .btn.btn-outline-danger")
                ->waitForTextIn("$firstRowSelector .col:nth-child(1) span", 'shape', self::wait)
                //// Still correct after reload
                ->visit('/#/c/1?t=project')
                ->waitForTextIn("$firstRowSelector .col:nth-child(1) span", 'shape', self::loadingWait)
                ->mouseOver("$firstRowSelector .col:nth-child(1)")
                // Update text & Save
                ->click("$firstRowSelector .edit-button")
                ->assertInputValue("$firstRowSelector input", 'shape')
                ->type("$firstRowSelector input", 'updated shape')
                ->click("$firstRowSelector .btn.btn-outline-success")
                ->waitForTextIn("$firstRowSelector .col:nth-child(1) span", 'updated shape', self::loadingWait)
                //// Still correct after reload
                ->visit('/#/c/1?t=project')
                ->waitForTextIn("$firstRowSelector .col:nth-child(1) span", 'updated shape', self::loadingWait);
        });
    }
    
    public function testDeleteLabel() {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $firstRowSelector = '.labels ul li:nth-child(1)';
            
            $browser->visitConcept(1, 'shape')
                ->assertCount('.labels ul li', 2)                
                ->assertMissing("$firstRowSelector .delete-button")
                ->mouseOver("$firstRowSelector .col:nth-child(1)")
                ->assertVisible("$firstRowSelector .delete-button")
                ->click("$firstRowSelector .delete-button")
                ->pause(1000)
                ->assertCount('.labels ul li', 2)
                // Still correct after reload
                ->visitConcept(1, 'shape')
                ->assertCount('.labels ul li', 2);
        });
    }
}