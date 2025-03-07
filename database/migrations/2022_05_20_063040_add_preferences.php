<?php

use App\Preference;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if(!is_part_of_spacialist()) {
            if(!Schema::hasTable('preferences')) {
                Schema::create('preferences', function (Blueprint $table) {
                    $table->increments('id');
                    $table->text('label');
                    $table->jsonb('default_value');
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
        }

        $defaultPrefs = [
            [
                'label' => 'prefs.gui-language',
                'default_value' => json_encode(['language_key' => 'en']),
            ],
            [
                'label' => 'prefs.link-to-spacialist',
                'default_value' => json_encode(['url' => '']),
            ],
            [
                'label' => 'prefs.project-name',
                'default_value' => json_encode(['name' => 'ThesauRex']),
            ],
            [
                'label' => 'prefs.enable-password-reset-link',
                'default_value' => json_encode(['use' => false]),
            ],
            [
                'label' => 'prefs.import-config',
                'default_value' => json_encode([
                    'ignore_missing_labels' => false,
                    'skip_missing_labels' => false,
                    'ignore_missing_languages' => false,
                    'ignore_missing_relations' => false,
                ]),
            ],
        ];
        foreach($defaultPrefs as $dp) {
            $prefExists = Preference::where('label', $dp['label'])->exists();
            if(!$prefExists) {
                $p = new Preference();
                $p->label = $dp['label'];
                $p->default_value = $dp['default_value'];
                $p->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if(!is_part_of_spacialist()) {
            Schema::dropIfExists('user_preferences');
            Schema::dropIfExists('preferences');
        } else {
            Preference::whereIn('label', [
                'prefs.link-to-spacialist',
                'prefs.import-config',
            ])->delete();
        }
    }
};
