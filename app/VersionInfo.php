<?php

namespace App;

use Illuminate\Support\Str;

class VersionInfo {
    // Semantic versioning
    private $major;
    private $minor;
    private $patch;

    private $release;
    private $releaseName;
    private $releaseHash;

    private $time;

    function __construct() {
        exec('git describe --tags', $tag, $exitcode);
        exec('git log -1 --format=%at', $ts, $exitcodeTs);
        if($exitcode === 0 && $exitcodeTs === 0) {
            $this->time = $ts[0] ?? time();
            $parts = explode('-', $tag[0]);
            $this->release = $parts[0];
            $this->releaseName = ucfirst($parts[1]);
            
            // Add pre-release info if required.
            if(preg_match('/^(alpha|beta|rc)/i', $this->releaseName, $matches)) {
                $preRelease = $matches[1];
                $releaseName = ucfirst($parts[2]) ?? 'Unreleased';
                $this->releaseName = $releaseName . '-' . ucfirst($preRelease);
            }
            
            $this->releaseHash = $parts[count($parts)-1] ?? null;
            $this->parseSemVer($parts[0]);
        } else {
            $this->release = 'v0.0.0';
            $this->releaseName = 'Unreleased';
            $this->releaseHash = null;
            $this->time = time();
            return;
        }
    }

    private function parseSemVer($versionPart) {
        if($versionPart && preg_match('/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/', $versionPart, $matches)) {
            $this->major = $matches[1];
            $this->minor = $matches[2] ?? '0';
            $this->patch = $matches[3] ?? '0';
        } else {
            $this->major = '0';
            $this->minor = '0';
            $this->patch = '0';
        }
    }

    public function getRelease() {
        return $this->release;
    }

    public function getReleaseName() {
        return $this->releaseName;
    }

    public function getReleaseHash() {
        return $this->releaseHash;
    }

    public function getReadableRelease() {
        return "$this->release ($this->releaseName)";
    }

    public function getFullRelease() {
        $releaseName = Str::lower($this->releaseName);
        $release = "$this->release-$releaseName";
        if(isset($this->releaseHash)) {
            $release .= "-$this->releaseHash";
        }
        return $release;
    }

    public function getMajor() {
        return $this->major;
    }

    public function getMinor() {
        return $this->minor;
    }

    public function getPatch() {
        return $this->patch;
    }

    public function getTime() {
        return $this->time;
    }
}
