<?php

namespace App;

class Helpers {
    public static function parseBoolean($str) {
        $acceptable = [true, 1, '1', 'true', 'TRUE'];
        return in_array($str, $acceptable, true);
    }
}
