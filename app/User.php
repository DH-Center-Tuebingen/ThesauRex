<?php

namespace App;

use App\Events\UserLogin;
use App\Events\UserLogout;
use App\Traits\SoftDeletesWithTrashed;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable;
    use SoftDeletesWithTrashed;
    use HasRoles;
    use HasApiTokens;
    // use Authenticatable;

    protected $guard_name = 'web';
    
    // Disables the remember_web token, as we don't need it using Sanctum authentication
    // and it would disrupt the session_cookies, as the token is managed in the User table, 
    // which conflicts when accessed from multiple websites.
    protected $rememberTokenName = null;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'nickname', 'email', 'password',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
    ];
       
    /**
     * Handles the login logic and broadcasts the login event.
     * @return void
     */
    public function login(){
        try {
            UserLogin::dispatch($this);
        } catch(\Exception $e) {
            // Fail silently if broadcasting fails (e.g., Reverb server not running)
            \Log::warning('Failed to broadcast login event: ' . $e->getMessage());
        }
    }
    
    /**
     * Handles the logout logic and broadcasts the logout event.
     * @return void
     */
    public function logout(){
        try {
            UserLogout::dispatch($this);
        } catch(\Exception $e) {
            // Fail silently if broadcasting fails (e.g., Reverb server not running)
            \Log::warning('Failed to broadcast logout event: ' . $e->getMessage());
        }
    }
    
   /**
     * Checks if the user has attempts from Spacialist set.
     *
     * This is a bit ugly, as it knows of the existance of Spacialist. 
     * But as mainly used as part of Spacialist we need to check this, otherwise this would open
     * a vulnerablility to Spacialist, as the Thesaurex would allow unlimited login attempts.
     * @return bool
     */
    public function usesSpacialistsAttemptsLogic(): bool {
        return $this->login_attempts !== null;
    }

    public function getLanguage() {
        $langObj = Preference::getUserPreference($this->id, 'prefs.gui-language');
        if(isset($langObj)) return $langObj->value;
        return 'en';
    }

    public function uploadAvatar($file) {
        Storage::delete($this->avatar);
        $filename = $this->id . "." . $file->getClientOriginalExtension();
        return $file->storeAs(
            'avatars',
            $filename
        );
    }

    public function setPermissions() {
        $permissions = [];
        foreach($this->roles as $role) {
            $rolePermissions = $role->permissions;
            foreach($rolePermissions as $p) {
                if(!isset($permissions[$p->name])) {
                    $permissions[$p->name] = 1;
                }

            }
        }
        $this->permissions = $permissions;
    }

    public function setMetadata($data) {
        if(!isset($this->metadata)) {
            $this->metadata = $data;
        } else {
            $this->metadata = array_replace($this->metadata, $data);
        }
        $this->save();
    }

    public function getAvatarUrlAttribute() {
        return isset($this->avatar) ? 'download/' . $this->avatar : null;
    }

    public function preferences() {
        return $this->hasMany('App\UserPreference');
    }
}
