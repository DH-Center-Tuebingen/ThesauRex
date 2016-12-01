<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateThConceptLabelExportTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('th_concept_label_export', function (Blueprint $table) {
            $table->increments('id');
            $table->text('lasteditor');
            $table->text('label');
            $table->integer('concept_id')->unsigned();
            $table->integer('language_id')->unsigned();
            $table->integer('concept_label_type')->default(1);
            $table->timestamps();

            $table->foreign('concept_id')->references('id')->on('th_concept_export')->onDelete('cascade');
            $table->foreign('language_id')->references('id')->on('th_language')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('th_concept_label_export');
    }
}
