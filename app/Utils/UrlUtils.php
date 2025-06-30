<?php

/**
 * This is also used in spacialist. 
 * Ideally this should be moved to a shared package.
 */

namespace App\Utils;

class UrlUtils {
    /**
     * When serving multiple applications (also already spacialist + thesaurex)
     * at the same domain, we need to separate the CSRF cookies.
     * This function extracts the subpath from the app URL
     * and returns it.
     */
    static function getSubPath($url) : string {
        $matches = [];
        $doesMatch = preg_match('/https?:\/\/.+?\/(.*)/', $url, $matches);
        if(!$doesMatch || !isset($matches[1]) || empty(trim($matches[1]))) {
            return '/';
        }
        return '/' . ltrim(trim($matches[1]), '/'); // remove leading and trailing slashes
    }
}
