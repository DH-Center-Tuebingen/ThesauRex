<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateThBroadersExportTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('th_broaders_export', function (Blueprint $table) {
            $table->integer('broader_id')->unsigned();
            $table->integer('narrower_id')->unsigned();

            $table->foreign('broader_id')->references('id')->on('th_concept_export')->onDelete('cascade');
            $table->foreign('narrower_id')->references('id')->on('th_concept_export')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('th_broaders_export');
    }
}
