<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class SetupThTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if($this->isFromScratch()) {
            $this->migrateFromScratch();
        } else {
            $this->migrateFromPreviousVersion();
        }
    }

    private function isFromScratch() {
        // 2018_01_29_164204_add_notes_table
        if(!Schema::hasTable('migrations')) {
            return true;
        }
        return !\DB::table('migrations')
            ->where('migration', '2018_01_29_164204_add_notes_table')
            ->exists();
    }

    private function migrateFromScratch() {
        $this->createUsers();
        $this->createSkosTables();
        $this->createSandboxSkosTables();
        $this->createEntrustTables();
        $this->createPreferences();
    }

    private function migrateFromPreviousVersion() {
        // Nothing to do
    }

    private function rollbackToScratch() {
        $this->dropPreferences();
        $this->dropEntrustTables();
        $this->dropSkosSandboxTables();
        $this->dropSkosTables();
        $this->dropUsers();
    }

    private function rollbackToPreviousVersion() {
        // Nothing to do
    }

    private function createUsers() {
        if(is_part_of_spacialist()) return;
        // Create Users
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->text('name');
            $table->text('email')->unique();
            $table->text('password');
            $table->rememberToken('remember_token')->nullable();
            $table->timestamps();
        });
        // Create Password Resets
        Schema::create('password_resets', function (Blueprint $table) {
            $table->string('email')->index();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    private function createSkosTables() {
        if(!is_part_of_spacialist()) {
            // Create ThConcept
            Schema::create('th_concept', function (Blueprint $table) {
                $table->increments('id');
                $table->text('concept_url')->unique();
                $table->text('concept_scheme');
                $table->boolean('is_top_concept')->default(false);
                $table->text('lasteditor');
                $table->timestamps();
            });
            // Create ThLanguage
            Schema::create('th_language', function (Blueprint $table) {
                $table->increments('id');
                $table->text('lasteditor');
                $table->text('display_name');
                $table->text('short_name');
                $table->timestamps();
            });
            // Create ThBroaders
            Schema::create('th_broaders', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('broader_id')->unsigned();
                $table->integer('narrower_id')->unsigned();
                $table->timestamps();

                $table->foreign('broader_id')->references('id')->on('th_concept')->onDelete('cascade');
                $table->foreign('narrower_id')->references('id')->on('th_concept')->onDelete('cascade');
            });
            // Create ThConceptLabels
            Schema::create('th_concept_label', function (Blueprint $table) {
                $table->increments('id');
                $table->text('lasteditor');
                $table->text('label');
                $table->integer('concept_id')->unsigned();
                $table->integer('language_id')->unsigned();
                $table->integer('concept_label_type')->default(1);
                $table->timestamps();

                $table->foreign('concept_id')->references('id')->on('th_concept')->onDelete('cascade');
                $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade');
            });
        }
        // Create ThNotes
        Schema::create('th_concept_notes', function (Blueprint $table) {
            $table->increments('id');
            $table->text('content');
            $table->integer('concept_id');
            $table->integer('language_id');
            $table->timestamps();
            $table->foreign('concept_id')->references('id')->on('th_concept')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    private function createSandboxSkosTables() {
        // Create ThConcept
        Schema::create('th_concept_master', function (Blueprint $table) {
            $table->increments('id');
            $table->text('concept_url')->unique();
            $table->text('concept_scheme');
            $table->boolean('is_top_concept')->default(false);
            $table->text('lasteditor');
            $table->timestamps();
        });
        // Create ThBroaders
        Schema::create('th_broaders_master', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('broader_id')->unsigned();
            $table->integer('narrower_id')->unsigned();
            $table->timestamps();

            $table->foreign('broader_id')->references('id')->on('th_concept_master')->onDelete('cascade');
            $table->foreign('narrower_id')->references('id')->on('th_concept_master')->onDelete('cascade');
        });
        // Create ThConceptLabels
        Schema::create('th_concept_label_master', function (Blueprint $table) {
            $table->increments('id');
            $table->text('lasteditor');
            $table->text('label');
            $table->integer('concept_id')->unsigned();
            $table->integer('language_id')->unsigned();
            $table->integer('concept_label_type')->default(1);
            $table->timestamps();

            $table->foreign('concept_id')->references('id')->on('th_concept_master')->onDelete('cascade');
            $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade');
        });
        // Create ThNotes
        Schema::create('th_concept_notes_master', function (Blueprint $table) {
            $table->increments('id');
            $table->text('content');
            $table->integer('concept_id');
            $table->integer('language_id');
            $table->timestamps();
            $table->foreign('concept_id')->references('id')->on('th_concept_master')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade')->onUpdate('cascade');
        });
    }

    private function createEntrustTables() {
        if(is_part_of_spacialist())  return;
        // Setup Entrust Roles/Permissions
        // Create table for storing roles
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name')->unique();
            $table->string('display_name')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });
        // Create table for associating roles to users (Many-to-Many)
        Schema::create('role_user', function (Blueprint $table) {
            $table->integer('user_id')->unsigned();
            $table->integer('role_id')->unsigned();

            $table->foreign('user_id')->references('id')->on('users')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')
                ->onUpdate('cascade')->onDelete('cascade');

            $table->primary(['user_id', 'role_id']);
        });
        // Create table for storing permissions
        Schema::create('permissions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name')->unique();
            $table->string('display_name')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });
        // Create table for associating permissions to roles (Many-to-Many)
        Schema::create('permission_role', function (Blueprint $table) {
            $table->integer('permission_id')->unsigned();
            $table->integer('role_id')->unsigned();

            $table->foreign('permission_id')->references('id')->on('permissions')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')
                ->onUpdate('cascade')->onDelete('cascade');

            $table->primary(['permission_id', 'role_id']);
        });
    }

    private function createPreferences() {
        if(is_part_of_spacialist()) return;
        // Create Preferences
        Schema::create('preferences', function (Blueprint $table) {
            $table->increments('id');
            $table->text('label');
            $table->jsonb('default_value');
            $table->boolean('allow_override')->nullable()->default(false);
            $table->timestamps();
        });
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('pref_id');
            $table->integer('user_id');
            $table->jsonb('value');
            $table->timestamps();

            $table->foreign('pref_id')->references('id')->on('preferences')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade')->onUpdate('cascade');
        });
        $defaultPrefs = [
            [
                'label' => 'prefs.gui-language',
                'default_value' => json_encode(['language_key' => 'en']),
                'allow_override' => true
            ],
            [
                'label' => 'prefs.project-name',
                'default_value' => json_encode(['name' => 'Spacialist']),
                'allow_override' => false
            ]
        ];
        foreach($defaultPrefs as $dp) {
            $p = new App\Preference();
            $p->label = $dp['label'];
            $p->default_value = $dp['default_value'];
            $p->allow_override = $dp['allow_override'];
            $p->save();
        }
    }

    private function dropUsers() {
        if(is_part_of_spacialist()) return;
        Schema::dropIfExists('password_resets');
        Schema::dropIfExists('users');
    }

    private function dropSkosTables() {
        Schema::dropIfExists('th_concept_notes');
        if(!is_part_of_spacialist()) {
            Schema::dropIfExists('th_concept_label');
            Schema::dropIfExists('th_broaders');
            Schema::dropIfExists('th_language');
            Schema::dropIfExists('th_concept');
        }
    }

    private function dropSkosSandboxTables() {
        Schema::dropIfExists('th_concept_notes_master');
        Schema::dropIfExists('th_concept_label_master');
        Schema::dropIfExists('th_broaders_master');
        Schema::dropIfExists('th_concept_master');
    }

    private function dropEntrustTables() {
        if(is_part_of_spacialist()) return;
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
    }

    private function dropPreferences() {
        if(is_part_of_spacialist()) return;
        Schema::dropIfExists('user_preferences');
        Schema::dropIfExists('preferences');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if($this->isFromScratch()) {
            $this->rollbackToScratch();
        } else {
            $this->rollbackToPreviousVersion();
        }
    }
}
