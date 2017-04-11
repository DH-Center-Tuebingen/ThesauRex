<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class RenameThTables extends Migration
{
    public $suffix = '_export';
    public $newSuffix = '_master';
    public $tables = ['th_concept', 'th_concept_label', 'th_broaders'];
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop getLabels view to recreate them with correct table names
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromMaster"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromExport"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromExport"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromMaster"
        ');

        // Rename tables
        foreach($this->tables as $t) {
            Schema::rename($t.$this->suffix, $t.$this->newSuffix);
        }

        // Recreate
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelsFromMaster" AS
            SELECT lbl.label,
                con.concept_url,
                lng.short_name
            FROM th_concept_label_master lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept_master con ON con.id = lbl.concept_id
            ORDER BY con.id, lbl.concept_label_type
        ');
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromMaster" AS
            SELECT "getLabelsFromMaster".concept_url,
                "getLabelsFromMaster".short_name AS lang,
                (array_agg("getLabelsFromMaster".label))[1] AS label
            FROM "getLabelsFromMaster"
                GROUP BY "getLabelsFromMaster".concept_url, "getLabelsFromMaster".short_name
        ');
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelsFromProject" AS
            SELECT lbl.label,
                con.concept_url,
                lng.short_name
            FROM th_concept_label lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept con ON con.id = lbl.concept_id
            ORDER BY con.id, lbl.concept_label_type
        ');
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromProject" AS
            SELECT "getLabelsFromProject".concept_url,
                "getLabelsFromProject".short_name AS lang,
                (array_agg("getLabelsFromProject".label))[1] AS label
            FROM "getLabelsFromProject"
                GROUP BY "getLabelsFromProject".concept_url, "getLabelsFromProject".short_name
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop getLabels view to recreate them with correct table names
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromMaster"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getFirstLabelForLanguagesFromProject"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromProject"
        ');
        Schema::getConnection()->statement('
            DROP VIEW public."getLabelsFromMaster"
        ');

        // Rename tables
        foreach($this->tables as $t) {
            Schema::rename($t.$this->newSuffix, $t.$this->suffix);
        }

        // Recreate
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getLabelsFromMaster" AS
            SELECT lbl.label,
                con.concept_url,
                lng.short_name
            FROM th_concept_label lbl
                JOIN th_language lng ON lbl.language_id = lng.id
                JOIN th_concept con ON con.id = lbl.concept_id
            ORDER BY con.id, lbl.concept_label_type
        ');
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromMaster" AS
            SELECT "getLabelsFromMaster".concept_url,
                "getLabelsFromMaster".short_name AS lang,
                (array_agg("getLabelsFromMaster".label))[1] AS label
            FROM "getLabelsFromMaster"
                GROUP BY "getLabelsFromMaster".concept_url, "getLabelsFromMaster".short_name
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
        Schema::getConnection()->statement('CREATE OR REPLACE VIEW public."getFirstLabelForLanguagesFromExport" AS
            SELECT "getLabelsFromExport".concept_url,
                "getLabelsFromExport".short_name AS lang,
                (array_agg("getLabelsFromExport".label))[1] AS label
            FROM "getLabelsFromExport"
                GROUP BY "getLabelsFromExport".concept_url, "getLabelsFromExport".short_name
        ');
    }
}
