use App\User;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

<?php

namespace Tests\Browser;


class DuskTestCaseTest extends DuskTestCase
{
    /**
     * Test that browseAsAdmin successfully authenticates as admin user.
     */
    public function testBrowseAsAdminAuthenticatesCorrectly(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $this->assertEquals('admin', $admin->nickname);
            
            // Verify we're authenticated by visiting home page
            $browser->visit('/')
                    ->waitForText('Projekt-Baum', 10)
                    ->assertDontSee('Invalid Credentials')
                    ->assertPathIs('/');
        });
    }

    /**
     * Test that browseAsAdmin provides access to protected admin routes.
     */
    public function testBrowseAsAdminAccessesProtectedRoutes(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/#/mg/users')
                    ->waitForText('Aktive Benutzer', 10)
                    ->assertDontSee('Invalid Credentials')
                    ->assertPresent('table');
        });
    }

    /**
     * Test that browseAsAdmin fails when admin user doesn't exist.
     */
    public function testBrowseAsAdminFailsWhenAdminUserNotFound(): void
    {
        // Temporarily remove admin user
        $originalAdmin = User::where('nickname', 'admin')->first();
        if($originalAdmin) {
            $originalAdmin->delete();
        }

        $this->expectException(\PHPUnit\Framework\AssertionFailedError::class);
        $this->expectExceptionMessage('Admin user not found');

        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            // This should never execute
        });
    }

    /**
     * Test that browseAs works with any user.
     */
    public function testBrowseAsWorksWithAnyUser(): void
    {
        // Create a test user if none exists besides admin
        $testUser = User::where('nickname', '!=', 'admin')->first();
        
        if(!$testUser) {
            $testUser = User::factory()->create(['nickname' => 'testuser']);
        }

        $this->browseAs($testUser, function (Browser $browser, User $user) use ($testUser) {
            $this->assertEquals($testUser->id, $user->id);
            
            // Visit home page to verify authentication works
            $browser->visit('/')
                    ->waitFor('#app', 10)
                    ->assertPresent('#app')
                    ->assertTitle('ThesauRex - Spacialist');
        });
    }

    /**
     * Test that authentication persists across page visits.
     */
    public function testAuthenticationPersistsAcrossPages(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            // Visit home page first
            $browser->visit('/')
                    ->waitForText('Projekt-Baum', 10);

            // Then visit admin page - should stay authenticated
            $browser->visit('/#/mg/users')
                    ->waitForText('Aktive Benutzer', 10)
                    ->assertDontSee('Invalid Credentials');

            // Go back to home - should still be authenticated
            $browser->visit('/')
                    ->waitForText('Projekt-Baum', 10)
                    ->assertDontSee('Invalid Credentials');
        });
    }

    /**
     * Test that base URL is configured correctly.
     */
    public function testBaseUrlConfiguration(): void
    {
        $baseUrl = $this->baseUrl();
        
        $this->assertNotEmpty($baseUrl);
        $this->assertStringStartsWith('http', $baseUrl);
        
        $this->browse(function (Browser $browser) use ($baseUrl) {
            $browser->visit('/');
            $currentUrl = $browser->driver->getCurrentURL();
            $this->assertStringContainsString(parse_url($baseUrl, PHP_URL_HOST), $currentUrl);
        });
    }

    /**
     * Test that database seeding works correctly in setup.
     */
    public function testDatabaseSeedingInSetup(): void
    {
        // Verify that admin user exists (created by TestSeeder)
        $admin = User::where('nickname', 'admin')->first();
        $this->assertNotNull($admin, 'Admin user should exist after seeding');
        $this->assertEquals('admin', $admin->nickname);
        
        // Verify we have some users in the database
        $userCount = User::count();
        $this->assertGreaterThan(0, $userCount, 'Should have at least one user after seeding');
    }

    /**
     * Test that unauthenticated access redirects to login.
     */
    public function testUnauthenticatedAccessRedirectsToLogin(): void
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/#/mg/users')
                    ->waitFor('form', 10) // Wait for login form to appear
                    ->assertPresent('input#email')
                    ->assertPresent('input#password')
                    ->assertSee('Einloggen');
        });
    }

    /**
     * Test that admin user has expected properties.
     */
    public function testAdminUserHasExpectedProperties(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $this->assertNotNull($admin->id);
            $this->assertEquals('admin', $admin->nickname);
            $this->assertNotNull($admin->email);
            $this->assertNotNull($admin->created_at);
        });
    }

    /**
     * Test that browseAs method executes closure with correct parameters.
     */
    public function testBrowseAsExecutesClosureCorrectly(): void
    {
        $executed = false;
        $receivedUser = null;
        $receivedBrowser = null;

        $this->browseAsAdmin(function (Browser $browser, User $user) use (&$executed, &$receivedUser, &$receivedBrowser) {
            $executed = true;
            $receivedUser = $user;
            $receivedBrowser = $browser;
        });

        $this->assertTrue($executed, 'Closure should be executed');
        $this->assertInstanceOf(User::class, $receivedUser, 'Should receive User instance');
        $this->assertInstanceOf(Browser::class, $receivedBrowser, 'Should receive Browser instance');
        $this->assertEquals('admin', $receivedUser->nickname, 'Should receive admin user');
    }

    /**
     * Test that Chrome driver is configured correctly.
     */
    public function testChromeDriverConfiguration(): void
    {
        $this->browse(function (Browser $browser) {
            // Verify browser is running and responsive
            $this->assertNotNull($browser->driver);
            
            // Test basic functionality
            $browser->visit('/')
                    ->waitFor('#app', 10)
                    ->assertPresent('#app');

            // Check that the browser can handle JavaScript
            $title = $browser->driver->getTitle();
            $this->assertStringContainsString('ThesauRex', $title);
        });
    }

    /**
     * Test that Vue application mounts correctly when authenticated.
     */
    public function testVueApplicationMountsWhenAuthenticated(): void
    {
        $this->browseAsAdmin(function (Browser $browser, User $admin) {
            $browser->visit('/')
                    ->waitFor('#app', 10)
                    ->assertPresent('#app')
                    ->assertTitle('ThesauRex - Spacialist')
                    ->waitForText('Projekt-Baum', 10);
        });
    }

    /**
     * Test that multiple browseAsAdmin calls work independently.
     */
    public function testMultipleBrowseAsAdminCallsWork(): void
    {
        $firstCallExecuted = false;
        $secondCallExecuted = false;

        $this->browseAsAdmin(function (Browser $browser, User $admin) use (&$firstCallExecuted) {
            $firstCallExecuted = true;
            $browser->visit('/')
                    ->waitForText('Projekt-Baum', 10);
        });

        $this->browseAsAdmin(function (Browser $browser, User $admin) use (&$secondCallExecuted) {
            $secondCallExecuted = true;
            $browser->visit('/#/mg/users')
                    ->waitForText('Aktive Benutzer', 10);
        });

        $this->assertTrue($firstCallExecuted, 'First browseAsAdmin call should execute');
        $this->assertTrue($secondCallExecuted, 'Second browseAsAdmin call should execute');
    }
}