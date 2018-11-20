<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddNotesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('th_concept_notes', function (Blueprint $table) {
            $table->increments('id');
            $table->text('content');
            $table->integer('concept_id');
            $table->integer('language_id');
            $table->timestamps();

            $table->foreign('concept_id')->references('id')->on('th_concept')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade')->onUpdate('cascade');
        });

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

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('th_concept_notes'); Schema::dropIfExists('th_concept_notes_master');
    }
}
