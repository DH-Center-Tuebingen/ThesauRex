<?php

namespace Tests\Browser;

use App\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ConceptTest extends DuskTestCase
{
    const wait = 4;

    public function testLoadedPage()
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/')
                ->waitForText('Projekt-Baum', self::wait)
                ->assertSee('Kein Konzept ausgewählt.')
                ->assertSee('color')
                ->assertSee('rgb')
                ->assertSee('shape')
                ->assertMissing('red')
                ->assertMissing('green')
                ->assertMissing('lime green');
        });
    }
    
    public function testCreateTopLevelConcept()
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $saveButton = ".modal-footer button.btn-outline-success";
            $browser->visit('/#/')
                ->waitForText('Projekt-Baum', self::wait)
                ->click('.btn-outline-success[title="Neues Top-Level-Konzept anlegen"]')
                ->waitForText("Neues Top-Level-Konzept", self::wait)
                ->assertButtonDisabled($saveButton)
                ->type('.modal input', 'Armadillo')
                ->assertButtonEnabled($saveButton)
                ->click($saveButton)
                ->waitForText('Armadillo', self::wait)
                ->assertSee('Armadillo')
                ->visit('/#/')
                ->waitForText('Projekt-Baum', self::wait)
                ->assertSee('Armadillo');
        });
    }
    
    public function testSelectingConcept() {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/')
                ->waitForText('Projekt-Baum', self::wait)
                ->assertSeeIn('a[data-path="1"]', 'rgb')
                ->click('a[data-path="1"]')
                ->waitForTextIn('.concept-detail', 'rgb', self::wait)
                ->assertSee('Übergeordnete Konzepte')
                ->assertSee('Beschriftungen')
                ->assertSee('Untergeordnete Konzepte')
                ->assertSee('Notizen')
                // Test if list exists and is ordered correctly
                ->assertSeeIn('.narrowers', 'red')
                ->assertSeeIn('.narrowers', 'green')
                ->assertSeeIn('.narrowers', 'blue')
                ->assertListOrder('.narrowers ul', ['blue', 'green', 'red']);

                //TODO:: Test if notes are visible.
        });
    }
    
    public function testOpeningTreeOnLoad() {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visitConcept(3, 'red')
                ->assertSee('blue')
                ->assertSee('green');
        }, "/c/3?t=project");
    }
    
    public function testDeleteCascade() {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $targetAnchor = ".tree-anchor[data-path='1']";
            
            $browser
                ->visitConcept(4, "rgb")
                ->assertSeeIn($targetAnchor, "rgb")
                ->execTreeContextMenu($targetAnchor, "Konzept löschen", 4, self::wait);
            $browser
                ->waitForText('Kaskadiertes Löschen', self::wait)
                ->selectDeleteMode('cascade')
                ->click('.modal .btn-outline-danger');
                
            $browser
                ->waitUntilMissing("rgb", self::loadingWait);
        });
    }
    
    public function testDeleteToTop(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $targetAnchor = ".tree-anchor[data-path='1,1']";

            $browser
                ->visitConcept(6, "lime green")
                ->assertSeeIn($targetAnchor, "green")
                ->execTreeContextMenu($targetAnchor, "Konzept löschen", 4, self::wait);
            $browser
                ->waitForText('Kaskadiertes Löschen', self::wait)
                ->selectDeleteMode('top')
                ->click('.modal .btn-outline-danger');
                
            $browser
                ->waitUntilMissing("green")
                ->pause(1000)
                ->assertSee("lime green")
                // The lime green get's the same path as the green had before
                ->assertSeeIn(".tree-anchor[data-path='1']", "lime green");
        });
    }
    
    public function testDeleteLevelUp(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $targetAnchor = ".tree-anchor[data-path='1,1']";

            $browser
                ->visitConcept(6, "lime green")
                ->assertSeeIn($targetAnchor, "green")
                ->execTreeContextMenu($targetAnchor, "Konzept löschen", 4, self::wait);
            $browser
                ->waitForText('Kaskadiertes Löschen', self::wait)
                ->selectDeleteMode('level-up')
                ->click('.modal .btn-outline-danger');
                
            $browser
                ->waitUntilMissing("green")
                ->pause(1000)
                ->assertSee("lime green")
                // The lime green get's the same path as the green had before
                ->assertSeeIn(".tree-anchor[data-path='1,1']", "lime green");
        });
    }

    public function testDeleteRerelate(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $targetAnchor = ".tree-anchor[data-path='1,1']";

            $browser
                ->visitConcept(6, "lime green")
                ->assertSeeIn($targetAnchor, "green")
                ->execTreeContextMenu($targetAnchor, "Konzept löschen", 4, self::wait);
            $browser
                ->waitForText('Kaskadiertes Löschen', self::wait)
                ->selectDeleteMode('rerelate')
                ->assertButtonDisabled(".modal .btn-outline-danger")
                ->scrollTo(".modal .multiselect-wrapper")
                ->searchMultiselect(".modal .multiselect-wrapper", "shape", 1, " > .multiselect-dropdown", " > .multiselect-dropdown .multiselect-option .fw-bold")
                ->assertButtonEnabled(".modal .btn-outline-danger")
                ->click('.modal .btn-outline-danger');
                
            $browser
                ->waitUntilMissing("green")
                ->waitForTriangle(".tree #project2", self::loadingWait)
                ->assertNotPresent("lime green")
                ->openTreeNode(".tree #project2")
                ->assertSee("lime green")
                // The lime green get's the same path as the green had before
                ->assertSeeIn(".tree-anchor[data-path='2,0']", "lime green");
                
        });
    }
}