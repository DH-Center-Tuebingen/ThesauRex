<?php

namespace Tests;

use App\User;
use Facebook\WebDriver\Chrome\ChromeOptions;
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Illuminate\Support\Collection;
use Laravel\Dusk\Browser;
use Laravel\Dusk\TestCase as BaseTestCase;
use PHPUnit\Framework\Attributes\BeforeClass;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Database\Seeders\TestSeeder;

abstract class DuskTestCase extends BaseTestCase
{
    use CreatesApplication;
    use DatabaseTruncation;
    
    // Wait time to wait for loading of the page or api requests
    const loadingWait = 10;
    // Shorter wait time for elements, animations or transitions 
    const wait = 4;

    protected function setup(): void
    {
        parent::setUp();
        $this->seed([TestSeeder::class]);
    }

    protected function tearDown(): void
    {
        // Close all browsers to ensure fresh state#
        // When continuing tests in an active browser window,
        // for some reason on the second test we get a 401 Unauthenticated error.
        // When navigating manually in the browser, this does not happen.
        // This is a workaround to ensure each test starts with a clean slate.
        $this->closeAll();
        
        parent::tearDown();
    }

    /**
     * Prepare for Dusk test execution.
     */
    #[BeforeClass]
    public static function prepare(): void
    {
        if(! static::runningInSail()) {
            static::startChromeDriver(['--port=9515']);
        }
    }

    /**
     * Create the RemoteWebDriver instance.
     */
    protected function driver(): RemoteWebDriver
    {
        $options = (new ChromeOptions)->addArguments(collect([
            $this->shouldStartMaximized() ? '--start-maximized' : '--window-size=1920,1080',
            '--disable-search-engine-choice-screen',
            '--disable-smooth-scrolling',
            '--disable-background-timer-throttling',
            '--disable-sync',
            '--disable-translate',
            '--no-first-run',
            //'--disable-web-security',  // Can help with CORS/security issues in tests
            // '--disable-features=VizDisplayCompositor',  // Helps with rendering issues
            // '--user-data-dir=/tmp/chrome-test-profile',  // Use consistent profile directory
        ])->unless($this->hasHeadlessDisabled(), function (Collection $items) {
            return $items->merge([
                '--disable-gpu',
                '--headless=new',
            ]);
        })->all());

        return RemoteWebDriver::create(
            $_ENV['DUSK_DRIVER_URL'] ?? env('DUSK_DRIVER_URL') ?? 'http://localhost:9515',
            DesiredCapabilities::chrome()->setCapability(
                ChromeOptions::CAPABILITY, $options
            )
        );
    }

    protected function browseAsAdmin(callable $closure, ?string $targetUrl = null): void
    {
        $admin = null;
        try{
            $admin = User::where('nickname', 'admin')->firstOrFail();
        } catch(\Exception $e) {
            // Handle the case where the admin user is not found
            $this->fail('Admin user not found');
        }
        $this->browseAs($admin, $closure, $targetUrl);
    }

    protected function browseAs(User $user, callable $closure, ?string $targetUrl): void
    {
        $this->browse(function (Browser $browser) use ($user, $closure, $targetUrl) {
            // Always clear session data first
            $browser->driver->manage()->deleteAllCookies();
            try {
                $browser->script('window.localStorage.clear(); window.sessionStorage.clear();');
            } catch(\Exception $e) {
                // Ignore if storage clearing fails
            }
            
            $loginLink = '/#/login';
            if($targetUrl) {
                $loginLink .= '?redirectTo=' . urlencode($targetUrl);
            }
            
            // Visit the login page and authenticate
            $browser->visit($loginLink)
                    ->waitForText('Anmelden', 15) // Increased timeout
                    ->type('email', $user->email ?? 'admin@localhost')
                    ->type('password', 'admin')
                    ->press('Einloggen')
                    ->waitForText('Projekt-Baum', 15) // Increased timeout
                    ->pause(1000); // Give time for session to establish
            
            // Execute the closure with the browser instance
            $closure($browser, $user);
        });
    }

    protected function loginAsAdmin(Browser $browser): void
    {
        $admin = User::where('nickname', 'admin')->firstOrFail();
        
        // Clear cookies and session data
        $browser->driver->manage()->deleteAllCookies();
        
        $browser->visit('/#/login')
                ->waitForText('Anmelden', 10)
                ->type('email', $admin->email ?? 'admin@localhost')
                ->type('password', 'admin')
                ->press('Einloggen')
                ->waitForText('Projekt-Baum', 10);
    }

    /**
     * Helper method to ensure fresh authentication for each test
     */
    protected function freshLogin(Browser $browser, ?User $user = null): void
    {
        $user = $user ?? User::where('nickname', 'admin')->firstOrFail();
        
        // Clear all cookies and local storage
        $browser->driver->manage()->deleteAllCookies();
        
        // Try to clear local storage, but don't fail if we can't
        try {
            $browser->script('window.localStorage.clear(); window.sessionStorage.clear();');
        } catch(\Exception $e) {
            // Ignore if local storage clearing fails
        }
        
        // Navigate to login and authenticate
        $browser->visit('/#/login')
                ->waitForText('Anmelden', 15) // Increased timeout
                ->type('email', $user->email ?? 'admin@localhost')
                ->type('password', 'admin')
                ->press('Einloggen')
                ->waitForText('Projekt-Baum', 15) // Increased timeout
                ->pause(1000); // Give time for session to establish
    }

    /**
     * Determine the application's base URL.
     */
    protected function baseUrl()
    {
        return env('APP_URL', 'http://localhost:8001');
    }
}
