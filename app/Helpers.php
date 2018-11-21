<?php

namespace App;

use App\Bibliography;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class Helpers {
    public static function parseBoolean($str) {
        $acceptable = [true, 1, '1', 'true', 'TRUE'];
        return in_array($str, $acceptable, true);
    }

    public static function getFullFilePath($filename) {
        return Storage::disk('public')->url(env('SP_FILE_PATH') .'/'. $filename);
    }

    public static function getStorageFilePath($filename) {
        return Storage::url(env('SP_FILE_PATH') .'/'. $filename);
    }

    public static function exifDataExists($exif, $rootKey, $dataKey) {
        return array_key_exists($rootKey, $exif) && array_key_exists($dataKey, $exif[$rootKey]);
    }

    public static function parseSql($builder) {
        $sql = $builder->toSql();
        $bindings = $builder->getBindings();
        foreach($bindings as $binding) {
            $value = is_numeric($binding) ? $binding : "'".$binding."'";
            $sql = preg_replace('/\?/', $value, $sql, 1);
        }
        return $sql;
    }

    public static function getColumnNames($table) {
        switch($table) {
            case 'attributes':
                return \DB::table('information_schema.columns')
                    ->select('column_name')
                    ->where('table_name', $table)
                    ->where('table_schema', 'public')
                    ->get()
                    ->pluck('column_name');
            default:
                return Schema::getColumnListing($table);

        }
    }
}
