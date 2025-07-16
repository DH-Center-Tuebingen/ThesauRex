<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AvatarController extends Controller
{
    /**
     * Download avatar file
     *
     * @param string $filename
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function download(string $filename): BinaryFileResponse {
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
