<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

class AvatarController extends Controller
{
    /**
     * Download avatar file
     * 
     * @param string $filename
     * @return \Illuminate\Http\Response
     */
    public function download($filename)
    {
        info(Storage::disk('avatars')->path(""));
        
        
        info(Storage::disk('avatars')->exists($filename) ? "File exists" : "File does not exist");
        
        // Check if file exists in avatars disk
        if(!Storage::disk('avatars')->exists($filename)) {
            abort(404, 'Avatar not found');
        }

        // Get the file path
        $filePath = Storage::disk('avatars')->path($filename);
        
        // Get the file's mime type
        $mimeType = Storage::disk('avatars')->mimeType($filename);
        
        // Return the file response
        return Response::file($filePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=3600', // Cache for 1 hour
        ]);
    }
}
