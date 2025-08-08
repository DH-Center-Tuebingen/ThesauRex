<?php

namespace Tests\Browser;

use App\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class NarrowerTest extends DuskTestCase
{
    
    public function testNavigate(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $narrowersListSelector = ".narrowers .list-group li";
            $narrowerLabelSelector = ".narrowers .multiselect .multiselect-options .multiselect-option span";
            $browser
                ->visitConcept(4, 'rgb')
                ->assertCount($narrowersListSelector, 3)
                ->assertSeeIn("{$narrowersListSelector}:nth-child(1) a", "blue")
                ->assertSeeIn("{$narrowersListSelector}:nth-child(2) a", "green")
                ->assertSeeIn("{$narrowersListSelector}:nth-child(3) a", "red")
                // Red concept is not visible in the tree
                ->assertMissing(".tree .tree-anchor[data-path='0,1']")
                ->assertMissing(".tree .tree-anchor[data-path='1,2']")
                ->element("{$narrowersListSelector}:nth-child(3) a")
                ->click();
                
            $browser
                ->waitForTextIn('.concept-detail h4', 'red', self::loadingWait)
                ->assertSeeIn('.concept-detail .broaders li:nth-child(2)', 'rgb')
                // Red concept should have been opened in the tree 
                ->assertVisible(".tree .tree-anchor[data-path='0,0']")
                ->assertVisible(".tree .tree-anchor[data-path='1,2']");
        });
    }
    
    public function testAddNew(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $narrowersListSelector = ".narrowers .list-group li";
            $narrowerLabelSelector = ".narrowers .multiselect .multiselect-options .multiselect-option span";
            $treeNodeSelector = ".tree .tree-node#project2";
            $browser
                ->visitConcept(1, 'shape')
                ->assertCount($narrowersListSelector, 0)
                ->assertTreeMissingTriangle($treeNodeSelector)
                ->searchMultiselectStrictly(".narrowers .multiselect", "triangle", '.narrowers .multiselect [aria-label="add new concept"] span.fw-bold', '.narrowers .multiselect [aria-label="add new concept"]')
                // Wait for the modal to appear
                ->waitForTextIn(".modal .modal-header", "Neues Konzept unter shape anlegen", self::loadingWait)
                ->assertSeeIn(".modal .dropdown-toggle div span:nth-child(2)", "Deutsch")
                // Searchtext should be prefilled
                ->assertInputValue(".modal input[type='text']", "triangle")
                ->assertButtonEnabled(".modal .btn-outline-success")
                ->assertButtonEnabled(".modal .btn-outline-secondary")
                ->click(".modal .btn-outline-success");
            $browser
                ->waitForTextIn("{$narrowersListSelector}:nth-child(1)", "triangle", self::loadingWait)
                ->assertCount($narrowersListSelector, 1)
                ->assertTreeHasTriangle($treeNodeSelector)
                // Can visit the triangle concept
                ->click("{$narrowersListSelector}:nth-child(1) a");
            $browser
                ->waitForTextIn('.concept-detail h4', 'triangle', self::loadingWait)
                // --> Check if still visible on reload
                ->visitConcept(1, 'shape')
                ->assertCount($narrowersListSelector, 1)
                ->assertSeeIn("{$narrowersListSelector}:nth-child(1) a", "triangle")
                ->assertTreeHasTriangle($treeNodeSelector)
                // Check if click is working after reload
                ->click("{$narrowersListSelector}:nth-child(1) a");
            $browser
                ->waitForTextIn('.concept-detail h4', 'triangle', self::loadingWait);
        });
    }

    public function testAddExisting(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $narrowersListSelector = ".narrowers .list-group li";
            $narrowerLabelSelector = ".narrowers .multiselect .multiselect-options .multiselect-option span";
            $treeNodeSelector = ".tree .tree-node#project2";
            $browser->visitConcept(1, 'shape')
                ->assertCount($narrowersListSelector, 0)
                ->assertTreeMissingTriangle($treeNodeSelector)
                ->searchMultiselect(".narrowers .multiselect", "red", 3, null, $narrowerLabelSelector)
                ->waitForTextIn("{$narrowersListSelector}:nth-child(1)", "red", self::loadingWait)
                ->assertCount($narrowersListSelector, 1)
                ->assertTreeHasTriangle($treeNodeSelector)
                // Can visit the red concept
                ->click("{$narrowersListSelector}:nth-child(1) a");
            $browser
                ->waitForTextIn('.concept-detail h4', 'red', self::loadingWait)
                 // --> Check if still visible on reload
                ->visitConcept(1, 'shape')
                ->assertCount($narrowersListSelector, 1)
                ->assertSeeIn("{$narrowersListSelector}:nth-child(1) a", "red")
                ->assertTreeHasTriangle($treeNodeSelector)
                // Check if click is working after reload
                ->click("{$narrowersListSelector}:nth-child(1) a");
            $browser
                ->waitForTextIn('.concept-detail h4', 'red', self::loadingWait);
        });
    }
    
    public function testRemove(){
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $narrowersListSelector = ".narrowers .list-group li";
            $narrowerLabelSelector = ".narrowers .multiselect .multiselect-options .multiselect-option span";
            $browser
                // --> Visit color concept
                ->visitConcept(2, 'color')
                ->assertCount($narrowersListSelector, 1)
                ->assertMissing("${narrowersListSelector}:nth-child(1) .remove-narrower-btn")
                ->mouseover("{$narrowersListSelector}:nth-child(1)")
                ->assertVisible("{$narrowersListSelector}:nth-child(1) .remove-narrower-btn")
                ->assertTreeHasTriangle(".tree .tree-node#project0")
                ->click("{$narrowersListSelector}:nth-child(1) .remove-narrower-btn")
                ->waitUntilMissing("{$narrowersListSelector}:nth-child(1)", 10)
                ->assertCount($narrowersListSelector, 0)
                ->assertTreeMissingTriangle(".tree .tree-node#project0")
                // --> Reload concept to ensure the change is persisted
                ->visitConcept(2, 'color')
                ->assertCount($narrowersListSelector, 0)
                ->assertTreeMissingTriangle(".tree .tree-node#project0");
        });
    }
    
    
    /**
     *  We split this in an additional test to ensure the 'red' entity is removable
     * and to prevent making the setup more complicated.
     */
    public function testRemoveCheckNotPossible(){
          $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $narrowersListSelector = ".narrowers .list-group li";
            $narrowerLabelSelector = ".narrowers .multiselect .multiselect-options .multiselect-option span";
            $browser
                // --> Visit the blue concept to open the rgb tree
                ->visitConcept(7, 'blue')
                ->visitConcept(4, 'rgb')
                ->assertCount($narrowersListSelector, 3)
                ->assertTreeOpen(".tree .tree-node#project1")
                ->assertTreeChildCount(".tree .tree-node#project1", 3)
                // Cannot remove the blue concept, as it has no other broaders
                ->mouseover("{$narrowersListSelector}:nth-child(1)")
                ->assertMissing("{$narrowersListSelector}:nth-child(1) .remove-narrower-btn")
                ->mouseover("{$narrowersListSelector}:nth-child(1)")
                ->assertVisible("{$narrowersListSelector}:nth-child(1) .not-allowed-handle")
                ->assertAttribute("{$narrowersListSelector}:nth-child(1) .not-allowed-handle", "title", "Diese Verbindung kann nicht aufgehoben werden, da dies die letzte Verbindung für das ausgewählte Konzept ist. Benutze das Kontextmenü im Baum um das Konzept zu löschen.")
                // Remove the red concept
                ->mouseover("{$narrowersListSelector}:nth-child(3)")
                ->assertVisible("{$narrowersListSelector}:nth-child(3) .remove-narrower-btn")
                ->mouseover("{$narrowersListSelector}:nth-child(3)")
                ->assertMissing("{$narrowersListSelector}:nth-child(3) .not-allowed-handle")
                ->click("{$narrowersListSelector}:nth-child(3) .remove-narrower-btn")
                ->waitUntilMissing("{$narrowersListSelector}:nth-child(3)", 10)
                ->assertCount($narrowersListSelector, 2)
                ->assertSeeIn("{$narrowersListSelector}:nth-child(1) a", "blue")
                ->assertSeeIn("{$narrowersListSelector}:nth-child(2) a", "green")
                ->assertTreeChildCount(".tree .tree-node#project1", 2)
                // --> Reload concept to ensure the change is persisted
                ->visitConcept(7, 'blue')
                ->visitConcept(4, 'rgb')
                ->assertCount($narrowersListSelector, 2)
                ->assertSeeIn("{$narrowersListSelector}:nth-child(1) a", "blue")
                ->assertSeeIn("{$narrowersListSelector}:nth-child(2) a", "green")
                ->assertTreeChildCount(".tree .tree-node#project1", 2);     
        });
    }

}