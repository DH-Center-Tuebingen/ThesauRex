<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use App\Preference;
use App\UserPreference;

class AddUserPrefs extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if(!Schema::hasTable('preferences')) {
            Schema::create('preferences', function (Blueprint $table) {
                $table->increments('id');
                $table->text('label');
                $table->jsonb('default_value');
                $table->boolean('allow_override')->nullable()->default(false);
                $table->timestamps();
            });
        }

        if(!Schema::hasTable('user_preferences')) {
            Schema::create('user_preferences', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('pref_id');
                $table->integer('user_id');
                $table->jsonb('value');
                $table->timestamps();

                $table->foreign('pref_id')->references('id')->on('preferences')->onDelete('cascade')->onUpdate('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade')->onUpdate('cascade');
            });
        }

        $defaultPrefs = [
            [
                'label' => 'prefs.show-sandbox-tree',
                'default_value' => json_encode(['show' => true]),
                'allow_override' => true
            ],
            [
                'label' => 'prefs.link-to-spacialist',
                'default_value' => json_encode(['url' => '']),
                'allow_override' => true
            ]
        ];

        // Check if (Spacialist) project name preference already exist
        if(Preference::where('label', 'prefs.project-name')->count() === 0) {
            $defaultPrefs[] = [
                'label' => 'prefs.project-name',
                'default_value' => json_encode(['name' => 'ThesauRex']),
                'allow_override' => false
            ];

        }

        foreach($defaultPrefs as $dp) {
            $p = new Preference();
            $p->label = $dp['label'];
            $p->default_value = $dp['default_value'];
            $p->allow_override = $dp['allow_override'];
            $p->save();
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $defaultPrefs = [
            [
                'label' => 'prefs.show-sandbox-tree',
                'default_value' => json_encode(['show' => true]),
                'allow_override' => true
            ],
            [
                'label' => 'prefs.link-to-spacialist',
                'default_value' => json_encode(['url' => '']),
                'allow_override' => true
            ]
        ];
        // Delete ThesauRex prefs by label name
        foreach($defaultPrefs as $dp) {
            Preference::where('label', $dp['label'])->delete();
        }

        // Only drop tables if no (Spacialist) records are left
        if(UserPreference::all()->count() === 0) Schema::dropIfExists('user_preferences');
        if(Preference::all()->count() === 0) Schema::dropIfExists('preferences');
    }
}
