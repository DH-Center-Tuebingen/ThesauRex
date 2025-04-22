<?php

namespace App\Providers;

use App\Observers\ThBroaderObserver;
use App\Observers\ThConceptLabelObserver;
use App\Observers\ThConceptNoteObserver;
use App\Observers\ThConceptObserver;
use App\Observers\ThLanguageObserver;
use App\ThBroader;
use App\ThBroaderSandbox;
use App\ThConcept;
use App\ThConceptLabelSandbox;
use App\ThConceptNote;
use App\ThConceptLabel;
use App\ThConceptNoteSandbox;
use App\ThConceptSandbox;
use App\ThLanguage;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();

        ThConcept::observe(ThConceptObserver::class);
        ThConceptSandbox::observe(ThConceptObserver::class);

        ThConceptLabel::observe(ThConceptLabelObserver::class);
        ThConceptLabelSandbox::observe(ThConceptLabelObserver::class);

        ThBroader::observe(ThBroaderObserver::class);
        ThBroaderSandbox::observe(ThBroaderObserver::class);

        ThConceptNote::observe(ThConceptNoteObserver::class);
        ThConceptNoteSandbox::observe(ThConceptNoteObserver::class);

        ThLanguage::observe(ThLanguageObserver::class);
    }
}
