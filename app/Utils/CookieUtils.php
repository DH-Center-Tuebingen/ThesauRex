<?php

namespace App\Utils;

class CookieUtils
{

    /**
     * Retrieve the application specific XSRF token cookie name.
     * This is used to separate the CSRF cookies when serving multiple applications
     * at the same domain.
     * 
     * @return string - Returns the cookie as "XSRF-TOKEN-{APP_NAME}" or if APP_NAME is not set "XSRF-TOKEN".
     */
    public static function xsrfName(){
        $appName = strtoupper(config('app.name', ''));
        // Remove all non-alphanumeric characters and replace them with a hyphen and remove leading/trailing hyphens
        $appName = trim(preg_replace('/[^A-Z0-9]+/', '-', $appName), '-');

        $xsrfTokenName = "XSRF-TOKEN";
        if($appName !== ''){
            $xsrfTokenName .= "-$appName";
        }
        // Add a suffix to avoid conflicts with other applications that might use the same cookie name
        $xsrfTokenName .= "-THESAUREX";
        return $xsrfTokenName;
    }
}