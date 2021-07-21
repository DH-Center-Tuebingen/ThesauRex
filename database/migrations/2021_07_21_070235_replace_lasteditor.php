<?php

use App\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ReplaceLasteditor extends Migration
{
    private $withLasteditor = [
        'th_concept_master',
        'th_concept_label_master',
        'th_language',
    ];

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
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
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }

    private function getElements($tableName)
    {
        switch ($tableName) {
            case 'th_concept_master':
                return \App\ThConceptSandbox::all();
            case 'th_concept_label_master':
                return \App\ThConceptLabelSandbox::all();
            case 'th_language':
                return \App\ThLanguage::all();
        }
    }
}
