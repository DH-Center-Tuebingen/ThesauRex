<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateThConceptExportTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('th_concept_export', function (Blueprint $table) {
            $table->increments('id');
            $table->text('concept_url')->unique();
            $table->text('concept_scheme');
            $table->text('lasteditor');
            $table->boolean('is_top_concept')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('th_concept_export');
    }
}
