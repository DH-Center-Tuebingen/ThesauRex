<?php
 
namespace App\Providers;
 
use Illuminate\Support\ServiceProvider;
use Laravel\Dusk\Browser;


/**
 * Dusk Macros Service Provider
 * 
 * This service provider registers custom browser macros for Laravel Dusk testing.
 * 
 * =======================================
 *       GENERAL INTERACTION MACROS
 * =======================================
 * 
 * mousedown(string $selector): Browser
 * scrollTo(string $selector): Browser
 * 
 * =======================================
 *           MULTISELECT MACROS
 * =======================================
 * 
 * addToMultiselect(string $selector, string $dropdownSelector, string $value): Browser
 * assertMultiselect(string $selector, array $expectedValues): Browser
 * searchMultiselect(string $selector, string $searchText, int $targetId, string $dropdownSelector = null): Browser
 * 
 * =======================================
 *       LIST/ORDER ASSERTION MACROS
 * =======================================
 * 
 * assertListOrder(string $selector, array $expectedOrder, ?string $textSelector = null): Browser
 * 
 * =======================================
 *            USER ROW MACROS
 * =======================================
 * 
 * assertUserRowDirtyIndicator(int $userId, bool $visible = true): Browser
 * assertUserRowEmail(int $userId, string $email): Browser
 * assertUserRowRoles(int $userId, array $expectedRoles): Browser
 * execUserRowAction(int $userId, string $action, string $label = null): Browser
 * pressUserOption(int $userId): Browser
 * typeUserRowEmail(int $userId, string $email): Browser
 * 
 */

 
class DuskServiceProvider extends ServiceProvider
{
    /**
     * Register Dusk's browser macros.
     */
    public function boot(): void
    {
        $this->registerGlobalMacros();
        $this->registerTreeMacros();
        $this->registerMultiselectMacros();
        $this->registerUserMacros();
    }
    
    /**
     * Register global browser macros.
     */
    private function registerGlobalMacros(): void
    {        
        Browser::macro("assertListOrder", function (string $selector, array $expectedOrder, ?string $textSelector = null) {
            $this->assertPresent($selector);
            
            $selector = "{$selector} > li";
            if($textSelector) {
                $selector .= " {$textSelector}";
            }
            
            $elements = $this->elements($selector);
            
            // Extract text content from each element
            $actualOrder = [];
            foreach($elements as $element) {
                $actualOrder[] = trim($element->getText());
            }
            
            // Assert arrays match
            if($expectedOrder !== $actualOrder) {
                throw new \Exception(
                    "Expected order [" . implode(', ', $expectedOrder) . "] " .
                    "but found [" . implode(', ', $actualOrder) . "]"
                );
            }
            
            return $this;
        });
        
        Browser::macro("mousedown", function (string $selector) {
            $selector = str_replace("'", "\\'", $selector);
            $this->script("document.querySelector('{$selector}').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));");
            return $this;
        });
        
        Browser::macro("scrollTo", function (string $selector) {
            $selector = str_replace("'", "\\'", $selector);
            $this->script("document.querySelector('{$selector}').scrollIntoView({ behavior: 'smooth', block: 'center' });");
            return $this;
        });
        
        Browser::macro("visitConcept", function (int $conceptId, string $conceptName, string $type = 'project') {
            $this->visit("/#/c/{$conceptId}?t={$type}")
                ->waitForTextIn('.concept-detail h4', $conceptName, 3);
            return $this;
        });
    }
    
    private function registerTreeMacros(): void
    {
        Browser::macro("assertTreeChildCount", function (string $treeNodeSelector, int $expectedCount) {
            $this->assertCount("{$treeNodeSelector} > ul > li", $expectedCount);
            return $this;
        });
        
        Browser::macro("assertTreeOpen", function (string $treeNodeSelector) {
            $this->assertAttributeContains($treeNodeSelector, 'class', 'tree-open');
            return $this;
        });
        
        Browser::macro("assertTreeMissingTriangle", function (string $treeNodeSelector) {
            $this->script("document.querySelector('{$treeNodeSelector}.tree-closed,{$treeNodeSelector}.tree-open')");
            return $this;
        });
        
        
        /**
         * This requires a tree-item and NOT AN ANCHOR!!!
         */
        Browser::macro("assertTreeHasTriangle", function (string $treeNodeSelector) {
            // Check if element has either tree-closed OR tree-open class
            $hasTreeClosed = $this->resolver->findOrFail($treeNodeSelector)->getAttribute('class');

            if(!str_contains($hasTreeClosed, 'tree-closed') && !str_contains($hasTreeClosed, 'tree-open')) {
                throw new \Exception("Element '{$treeNodeSelector}' does not have either 'tree-closed' or 'tree-open' class");
            }
            
            return $this;
        });
        
        Browser::macro("waitForTriangle", function($treeNodeSelector, $waitInSeconds){
            for($currentWaitTime = 0; $currentWaitTime < $waitInSeconds; $currentWaitTime +=0.5) {
                try{
                    $this->assertTreeHasTriangle($treeNodeSelector);
                    return $this;
                } catch(\Exception $e) {
                    $this->pause(500); // Wait for 0.5 seconds
                }
            }
            throw new \Exception("Triangle for '{$treeNodeSelector}' did not appear within {$waitInSeconds} seconds");
        });
        
        /**
         * This requires a tree-item and NOT AN ANCHOR!!!
         */
        Browser::macro("openTreeNode", function (string $treeNodeSelector) {
            $this->click("{$treeNodeSelector} .tree-icon");
            return $this;
        }); 
        
        Browser::macro("execTreeContextMenu", function(string $anchor, string $text, int $index, int $wait = 0){
            $this->rightClick($anchor)
                ->waitForText($text, $wait)
                ->click("{$anchor} .dropdown-menu li:nth-child({$index})");
        });
        
        Browser::macro("selectDeleteMode", function ($deleteMode){
            $availableModes= [
                "cascade" => "#delete-concept-action-cascade",
                "level-up" => "#delete-concept-action-level",
                "top" => "#delete-concept-action-top",
                "rerelate" => "#delete-concept-action-rerelate"
            ];

            if(!array_key_exists($deleteMode, $availableModes)) {
                throw new \Exception("Invalid delete mode: {$deleteMode}");
            }

            $selectedMode = $availableModes[$deleteMode];
            $availableModes = array_diff_key($availableModes, [$deleteMode => true]);

            $this
                ->scrollTo($selectedMode)
                ->click($selectedMode)
                ->assertChecked($selectedMode);
            foreach($availableModes as $mode) {
                $this->assertNotChecked($mode);
            }

            return $this;
        });
    }
    
    private function registerMultiselectMacros(): void
    {
        
        Browser::macro("searchMultiselectStrictly", function (string $selector, string $searchText, string $labelSelector = null, string $target) {
            $this->mousedown($selector)
                ->pause(300)
                ->type($selector . " input[type='text']", $searchText)
                ->waitForTextIn($labelSelector, $searchText, 10)
                ->scrollTo($target)
                ->click($target);

            return $this;
        });
        
        Browser::macro("searchMultiselect", function (string $selector, string $searchText, int $targetId, $dropdownSelector = null, string $labelSelector = null) {
            if(!$dropdownSelector) {
                $dropdownSelector = "{$selector} .multiselect-options";
            }
            
            if(!$labelSelector) {
                $labelSelector = "{$dropdownSelector} .multiselect-option span";
            }
            
            $this->mousedown($selector)
                ->pause(300)
                ->type($selector . " input[type='text']", $searchText)
                ->waitForTextIn($labelSelector, $searchText, 10)
                ->scrollTo($dropdownSelector . " .multiselect-option[aria-label='{$targetId}']")
                ->click($dropdownSelector . " .multiselect-option[aria-label='{$targetId}']")
            ;
            return $this;
        });
        
        Browser::macro("addToMultiselect", function (string $selector, string $dropdownSelector, string $value) {
            $this->click($selector)
                ->waitForTextIn($dropdownSelector . " .multiselect-option", $value, 10)
                ->scrollTo($dropdownSelector . " .multiselect-option[aria-label='{$value}']")
                ->element($dropdownSelector . " .multiselect-option[aria-label='{$value}']")
                ->click();

            return $this;
        });
        
        Browser::macro("assertMultiselect", function (string $selector, array $expectedValues) {
            $this->assertVisible($selector);
            $elements = $this->elements("{$selector} .multiselect-tag-wrapper");
            
            // Extract text content from each element
            $actualRoles = [];
            foreach($elements as $element) {
                $actualRoles[] = trim($element->getText());
            }
            
            // Sort both arrays for comparison
            sort($expectedValues);
            sort($actualRoles);
            
            // Assert arrays match
            if($expectedValues !== $actualRoles) {
                throw new \Exception(
                    "Expected roles [" . implode(', ', $expectedValues) . "] " .
                    "but found [" . implode(', ', $actualRoles) . "]"
                );
            }
            
            return $this;
        });
    }
    
    private function registerUserMacros(): void
    {
        Browser::macro('pressUserOption', function (int $userId) {
            $this->press("#user-row-{$userId} td:nth-child(6) .dropdown");
            return $this;
        });
        
        Browser::macro('assertUserRowEmail', function (int $userId, string $email) {
            $this->assertInputValue("#user-row-{$userId} td:nth-child(2) input", $email);
            return $this;
        });
        
        Browser::macro('assertUserRowRoles', function (int $userId, array $expectedRoles) {
            // Get all multiselect tag wrapper elements in the user row
            return $this->assertMultiselect("#user-row-{$userId} td:nth-child(3)", $expectedRoles);
        });
        
        Browser::macro('execUserRowAction', function (int $userId, string $action, string $label = null) {
            if(!$label) {
                $label = $action;
            }
            
            $this
                ->pause(100)    
                ->press("#user-options-dropdown-{$userId}")
                ->waitForText($label, 10)
                ->click("#user-row-{$userId} td:nth-child(6) .dropdown-menu .dropdown-item[data-action='{$action}']");
            return $this;
        });
        
        Browser::macro("typeUserRowEmail", function (int $userId, string $email) {
            $this->type("#user-row-{$userId} td:nth-child(2) input", $email);
            return $this;
        });
        
        Browser::macro("assertUserRowDirtyIndicator", function (int $userId, $visible = true) {
            if($visible) {
                $this->assertVisible("#user-row-{$userId} td:nth-child(6) svg[data-icon='circle']");
            } else {
                $this->assertNotPresent("#user-row-{$userId} td:nth-child(6) svg[data-icon='circle']");
            }
            return $this;
        });
    }
}