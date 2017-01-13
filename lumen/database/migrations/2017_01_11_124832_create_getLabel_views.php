<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateGetLabelViews extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelsFromMaster" AS
            SELECT lbl.label,
                con.concept_url,
                lng.short_name
            FROM th_concept_label lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept con ON con.id = lbl.concept_id
            ORDER BY con.id, lbl.concept_label_type
        ');

        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelsFromExport" AS
            SELECT lbl.label,
                con.concept_url,
                lng.short_name
            FROM th_concept_label_export lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept_export con ON con.id = lbl.concept_id
            ORDER BY con.id, lbl.concept_label_type
        ');

        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromMaster" AS
            SELECT "getLabelsFromMaster".concept_url,
                "getLabelsFromMaster".short_name AS lang,
                (array_agg("getLabelsFromMaster".label))[1] AS label
            FROM "getLabelsFromMaster"
                GROUP BY "getLabelsFromMaster".concept_url, "getLabelsFromMaster".short_name
        ');

        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromExport" AS
            SELECT "getLabelsFromExport".concept_url,
                "getLabelsFromExport".short_name AS lang,
                (array_agg("getLabelsFromExport".label))[1] AS label
            FROM "getLabelsFromExport"
                GROUP BY "getLabelsFromExport".concept_url, "getLabelsFromExport".short_name
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromExport"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromMaster"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromExport"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromMaster"
        ');
    }
}
