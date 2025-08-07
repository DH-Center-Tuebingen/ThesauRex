<?php

namespace Tests\Browser;

use App\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class UserTest extends DuskTestCase
{
    
    /**
     * Test that the application loads correctly.
     */
    public function testSiteAccessibleWhenAdminIsLoggedIn(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/mg/users')
                    ->waitForText('Aktive Benutzer', 10)
                    ->waitForText('Adam Admin', 10);
                    
            $list = [
                'Admin',
                'Adam Admin',
                'Betty Boss',
                'Clara Guest',
            ];
            
            for($i = 0; $i < count($list); $i++) {
                $name = $list[$i];
                $nth= $i + 1;
                $browser->assertSeeIn("tbody > tr:nth-child($nth)", $name);
            }
        });
    }
    
    public function testAddUser():void {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            
            $testUser = [
                "id" => 6, // Assuming this is the next available ID
                "name" => "X Added User",
                "nickname" => "x-added-user",
                "incorrect_email" => "wrong-mail.com",
                "email" => "added-user@runtime.com",
                "incorrect_password" => "short",
                "password" => "added-password",
            ];

            $browser->visit('/#/mg/users')
                ->waitForText('Neuen Benutzer hinzufügen', 10)
                ->element('.btn-outline-success')->click();
                
            $modalSaveButton = ".modal-footer button.btn-outline-success";
                    
            // Cancel New User creation
            $browser->waitForText('Neuer Benutzer', 10)
                ->assertSee('Neuer Benutzer')
                ->assertSee('Name')
                ->assertSee('Spitzname')
                ->assertSee('E-Mail-Adresse')
                ->assertSee('Passwort')
                ->assertSee('Passwort wiederholen')
                ->assertButtonDisabled($modalSaveButton)
                ->assertButtonEnabled('.modal-footer button.btn-outline-secondary')
                ->element('.modal-footer button.btn-outline-secondary')
                ->click();
                
            // Check that the modal is closed and open new user creation modal again
            $browser->visit('/#/mg/users')
                ->assertNotPresent('.modal-container')
                ->waitForText('Neuen Benutzer hinzufügen', 10)
                ->element('.btn-outline-success')->click();
                    
            // Test New User creation
            $browser
                ->waitForText('Neuer Benutzer', 10)
                ->type('input[id="name"]', $testUser['name'])
                ->type('input[id="nickname"]', $testUser['nickname'])
                ->type('input[id="email"]', $testUser['incorrect_email'])
                ->waitForText('email must be a valid email',2)
                ->type('input[id="email"]', $testUser['email'])
                ->pause(300)
                ->assertNotPresent('input[id="email"]+.invalid-feedback > span')
                ->type('input[id="password"]', $testUser['incorrect_password'])
                ->waitForText('password must be at least 6 characters', 2)
                ->type('input[id="password"]', $testUser['password'])
                ->assertButtonDisabled($modalSaveButton)
                ->pause(300)
                ->assertNotPresent('input[id="password"]+.invalid-feedback > span')
                ->type('input[id="password_confirm"]', $testUser['incorrect_password'])
                ->waitForText('Passwords must match', 2)
                ->type('input[id="password_confirm"]', $testUser['password'])
                ->pause(300)
                ->assertButtonEnabled($modalSaveButton)
                ->press($modalSaveButton)
                ->pause(2000); // Wait for form submission
        
                
            // Check if newly created user is in the list
            $browser->waitForText('Aktive Benutzer', 10)
                ->pause(1000) // Give time for the page to update
                ->assertSee($testUser['name'])
                ->assertSee($testUser['nickname'])
                ->assertUserRowEmail($testUser['id'], $testUser['email']);
        });
    }
    
    public function testDeactivateUser(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/mg/users')
                ->waitForText('Clara Guest', 10)
                ->execUserRowAction(4, "deactivate", "Deaktivieren")
                ->waitForText('Gewisse Einträge', 10)
                ->click(".modal .btn-outline-success")
                ->waitFor("#deactivated-users-table #user-row-4", 10);
        });
    }
    
    public function testReactivateUser(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/mg/users')
                ->waitForText('Dora Deactivated', 10)
                ->execUserRowAction(5, "reactivate", "Reaktivieren")
                ->waitFor("#active-users-table #user-row-4", 10);
        });
    }
    
     public function testUpdateUser(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $updatedMail = "a.adam@updated.net";
            $browser->visit('/#/mg/users')
                ->waitForText('Adam Admin', 10)
                // Test if email sets dirty indicator
                ->assertUserRowDirtyIndicator(3, false)
                ->assertUserRowEmail(3, "betty@mock.com")
                ->typeUserRowEmail(3, "betty2@updated.net")
                ->assertUserRowDirtyIndicator(3)
                ->execUserRowAction(3, "reset", "Zurücksetzen")
                ->assertUserRowEmail(3, "betty@mock.com")
                ->assertUserRowDirtyIndicator(3, false)
                
                // Test if roles sets dirty indicator
                ->assertUserRowDirtyIndicator(4, false)
                ->assertUserRowRoles(4, ["Guest"])
                ->addToMultiselect("#user-row-4 td:nth-child(3) .multiselect-wrapper", ".multiselect-dropdown-for-user-4" ,"Administrator")
                ->pause(300) // Wait for the multiselect to update
                ->assertUserRowDirtyIndicator(4)
                ->execUserRowAction(4, "reset", "Zurücksetzen")
                ->assertUserRowRoles(4, ["Guest"])
                ->assertUserRowDirtyIndicator(4, false)

                // Test actual update
                ->assertUserRowEmail(2, "adam@mock.com")
                ->assertUserRowRoles(2, ["Administrator"])
                ->typeUserRowEmail(2, $updatedMail)
                ->assertUserRowEmail(2, $updatedMail)
                ->addToMultiselect("#user-row-2 td:nth-child(3) .multiselect-wrapper", ".multiselect-dropdown-for-user-2" ,"Guest")
                ->execUserRowAction(2, "save", "Speichern")
                ->pause(300) // Wait for the update to complete
                ->assertUserRowEmail(2, $updatedMail)
                ->assertUserRowRoles(2, ["Administrator", "Guest"])
                ->assertUserRowDirtyIndicator(2, false)
                //// Check if data is persistend after reload.
                ->visit('/#/mg/users')
                ->assertUserRowEmail(2, $updatedMail)
                ->waitForText('Adam Admin', 10)
                ->assertUserRowRoles(2, ["Administrator", "Guest"])
                ->assertUserRowDirtyIndicator(2, false);
                
        });
    }
}