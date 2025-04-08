<?php

use App\ThConcept;
use App\ThConceptLabel;
use App\ThConceptLabelSandbox;
use App\ThConceptSandbox;
use App\ThLanguage;
use App\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ReplaceLasteditor extends Migration
{
    private array $withLasteditor = [
        'th_concept_master',
        'th_concept',
        'th_concept_label_master',
        'th_concept_label',
        'th_language',
    ];

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void {
        if(!Schema::hasColumn('users', 'avatar') && !Schema::hasColumn('users', 'metadata')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('avatar')->nullable();
                $table->jsonb('metadata')->nullable();
                $table->softDeletes();
            });
        }

        foreach ($this->withLasteditor as $le) {
            // Skip tables which already updated by Spacialist
            if(Schema::hasColumn($le, 'user_id')) continue;

            $entries = $this->getElements($le);

            Schema::table($le, function (Blueprint $table) {
                $table->dropColumn('lasteditor');
                $table->integer('user_id')->nullable();
            });

            foreach ($entries as $e) {
                try {
                    $user = User::where('name', $e->lasteditor)->firstOrFail();
                } catch (ModelNotFoundException $exc) {
                    $user = User::orderBy('id')->first();
                }
                $e->user_id = $user->id;
                $e->save();
            }

            Schema::table($le, function (Blueprint $table) {
                $table->integer('user_id')->nullable(false)->change();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if(!Storage::exists('avatars')) {
            Storage::makeDirectory('avatars');
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void {
        if(Schema::hasColumn('users', 'avatar') && Schema::hasColumn('users', 'metadata')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('avatar');
                $table->dropColumn('metadata');
                $table->dropSoftDeletes();
            });
        }

        foreach($this->withLasteditor as $le) {
            $entries = $this->getElements($le);

            Schema::table($le, function (Blueprint $table) {
                $table->dropColumn('user_id');
                $table->text('lasteditor')->nullable();
            });

            foreach($entries as $e) {
                try {
                    $user = User::findOrFail($e->user_id);
                } catch(ModelNotFoundException $e) {
                    $user = User::orderBy('id')->first();
                }
                $e->lasteditor = $user->name;
                $e->saveQuietly();
            }

            Schema::table($le, function (Blueprint $table) {
                $table->text('lasteditor')->nullable(false)->change();
            });
        }

        if(Storage::exists('avatars')) {
            Storage::deleteDirectory('avatars');
        }
    }

    private function getElements(string $tableName): Collection {
        switch($tableName) {
            case 'th_concept':
                return ThConcept::all();
            case 'th_concept_label':
                return ThConceptLabel::all();
            case 'th_concept_master':
                return ThConceptSandbox::all();
            case 'th_concept_label_master':
                return ThConceptLabelSandbox::all();
            case 'th_language':
                return ThLanguage::all();
        }
    }
}
