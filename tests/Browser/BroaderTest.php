<?php

namespace Tests\Browser;

use App\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class BroaderTest extends DuskTestCase
{
    
    public function testNavigate(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $broadersListSelector = ".broaders .list-group li";
            $broaderLabelSelector = ".broaders .multiselect .multiselect-options .multiselect-option span";
            $browser
                ->visitConcept(3, 'red')
                ->assertCount($broadersListSelector, 2)
                ->assertSeeIn("{$broadersListSelector}:nth-child(1) a", "color")
                ->assertSeeIn("{$broadersListSelector}:nth-child(2) a", "rgb")
                ->element("{$broadersListSelector}:nth-child(1) a")
                ->click();
                
            $browser
                ->waitForTextIn('.concept-detail h4', 'color', self::loadingWait)
                ->assertSeeIn('.concept-detail .narrowers li:nth-child(1)', 'red');
        });
    }

    public function testAdd(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $broadersListSelector = ".broaders .list-group li";
            $broaderLabelSelector = ".broaders .multiselect .multiselect-options .multiselect-option span";
            $browser->visitConcept(3, 'red')
                ->assertCount($broadersListSelector, 2)
                ->searchMultiselect(".broaders .multiselect", "shape", 1, null, $broaderLabelSelector)
                ->waitForTextIn("{$broadersListSelector}:nth-child(3)", "shape", self::loadingWait)
                ->assertCount($broadersListSelector, 3)
                ->assertSeeIn("{$broadersListSelector}:nth-child(3) a", "shape");
        });
    }
    
    public function testRemove(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $broadersListSelector = ".broaders .list-group li";
            $broaderLabelSelector = ".broaders .multiselect .multiselect-options .multiselect-option span";
            $browser
                // --> Visit blue concept
                ->visitConcept(7, 'blue')
                ->assertCount($broadersListSelector, 1)
                ->assertMissing("${broadersListSelector}:nth-child(1) .remove-broader-btn")
                ->mouseover("{$broadersListSelector}:nth-child(1)")
                ->assertVisible("{$broadersListSelector}:nth-child(1) .remove-not-possible")
                // --> Visit red concept
                ->visitConcept(3, 'red')
                ->assertCount($broadersListSelector, 2)
                ->assertVisible(".tree .tree-anchor[data-path='1,2']")
                ->assertMissing("{$broadersListSelector}:nth-child(1) .remove-not-possible")
                ->assertMissing("{$broadersListSelector}:nth-child(2) .remove-not-possible")
                ->mouseover("{$broadersListSelector}:nth-child(1)")
                ->assertVisible("{$broadersListSelector}:nth-child(1) .remove-broader-btn")
                ->mouseover("{$broadersListSelector}:nth-child(2)")
                ->assertVisible("{$broadersListSelector}:nth-child(2) .remove-broader-btn")
                // --> Remove first broader
                ->click("{$broadersListSelector}:nth-child(2) .remove-broader-btn")
                ->waitUntilMissing("{$broadersListSelector}:nth-child(2)", 10)
                ->assertCount($broadersListSelector, 1)
                ->assertSeeIn("{$broadersListSelector}:nth-child(1)", "color")
                ->assertMissing(".tree .tree-anchor[data-path='1,2']")
                // --> Reload concept to ensure the change is persisted
                ->visitConcept(3, 'red')
                ->assertCount($broadersListSelector, 1)
                ->assertSeeIn("{$broadersListSelector}:nth-child(1)", "color")
                ->assertMissing(".tree .tree-anchor[data-path='1,2']");
        });
    }
    
}