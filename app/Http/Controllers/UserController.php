<?php

namespace App\Http\Controllers;

use App\Permission;
use App\Role;
use App\User;
use App\Http\Controllers\Controller;
use App\RolePreset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function __construct() {
        $this->middleware('auth:api', ['except' => ['login']]);
    }

    // GET

    public function refreshToken() {
        return response()->json([
                'status' => 'success'
            ]);
    }

    public function getUser(Request $request) {
        try {
            $user = User::findOrFail(auth()->user()->id);
            $user->setPermissions();

            return response()->json([
                'status' => 'success',
                'data' => $user
            ]);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This user does not exist'
            ], 400);
        }
    }

    public function getUsers() {
        $user = auth()->user();
        if(!$user->can('users_roles_read')) {
            return response()->json([
                'error' => __('You do not have the permission to view users')
            ], 403);
        }
        $users = User::with('roles')->withoutTrashed()->orderBy('id')->get();
        $delUsers = User::with('roles')->onlyTrashed()->orderBy('id')->get();

        return response()->json([
            'users' => $users,
            'deleted_users' => $delUsers,
        ]);
    }

    public function getRoles() {
        $user = auth()->user();
        if(!$user->can('users_roles_read')) {
            return response()->json([
                'error' => __('You do not have the permission to view roles')
            ], 403);
        }
        $roles = Role::with(['permissions', 'derived'])->orderBy('id')->get();
        $perms = Permission::orderBy('id')->get();
        $presets = RolePreset::all();

        return response()->json([
            'roles' => $roles,
            'permissions' => $perms,
            'presets' => $presets,
        ]);
    }

    public function getAccessGroups(Request $request) {
        $user = auth()->user();
        if(!$user->can('users_roles_read')) {
            return response()->json([
                'error' => __('You do not have the permission to view roles')
            ], 403);
        }

        $groups = th_get_permission_groups(true);

        return response()->json($groups);
    }

    // POST

    public function login(Request $request) {
        $this->validate($request, [
            'email' => 'required_without:nickname|email|max:255|exists:users,email',
            'nickname' => 'required_without:email|alpha_num|max:255|exists:users,nickname',
            'password' => 'required'
        ]);

        $creds = ['password'];
        if($request->has('nickname')) {
            $creds[] = 'nickname';
        } else {
            $creds[] = 'email';
        }
        $credentials = request($creds);

        if(!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'Invalid Credentials'], 400);
        }

        return response()
            ->json(null, 200)
            ->header('Authorization', $token);
    }

    public function addUser(Request $request) {
        $user = auth()->user();
        if(!$user->can('users_roles_create')) {
            return response()->json([
                'error' => 'You do not have the permission to add new users'
            ], 403);
        }
        $this->validate($request, [
            'email' => 'required_without:nickname|email|max:255|unique:users,email',
            'nickname' => 'required_without:email|alpha_dash|max:255|unique:users,nickname',
            'name' => 'required|string|max:255',
            'password' => 'required',
        ]);

        $name = $request->get('name');
        $nickname = $request->get('nickname');
        $email = $request->get('email');
        $password = Hash::make($request->get('password'));

        $user = new User();
        $user->name = $name;
        $user->nickname = $nickname;
        $user->email = $email;
        $user->password = $password;
        $user->save();

        return response()->json($user);
    }

    public function addAvatar(Request $request) {
        $user = auth()->user();
        $this->validate($request, [
            'file' => 'required|file',
        ]);

        try {
            $user = User::findOrFail($user->id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        $file = $request->file('file');
        $path = $user->uploadAvatar($file);
        info($path);
        $user->avatar = $path;
        $user->save();

        // return user without roles relation
        $user->unsetRelation('roles');

        return response()->json($user);
    }

    public function addRole(Request $request) {
        $user = auth()->user();
        if(!$user->can('users_roles_create')) {
            return response()->json([
                'error' => __('You do not have the permission to add roles')
            ], 403);
        }
        $this->validate($request, Role::rules);

        $role = new Role();
        $role->guard_name = 'web';
        foreach($request->only(array_keys(Role::rules)) as $key => $value) {
            $role->{$key} = $value;
        }

        if($request->has('derived_from')) {
            $preset = RolePreset::find($request->get('derived_from'));
            $permissions = $preset->fullSet;
            $role->syncPermissions($permissions);
        }

        $role->save();
        $role = Role::find($role->id);
        $role->load(['derived', 'permissions']);

        return response()->json($role);
    }

    public function logout(Request $request) {
        auth()->logout();
    }

    // PATCH

    public function patchUser(Request $request, $id) {
        $user = auth()->user();

        if(!$user->can('users_roles_write')) {
            return response()->json([
                'error' => __('You do not have the permission to modify user data')
            ], 403);
        }
        $this->validate($request, [
            'roles' => 'array',
            'email' => 'email',
            'name' => 'string|max:255',
            'nickname' => 'alpha_dash|max:255|unique:users,nickname',
            'phonenumber' => 'nullable|string|max:255',
        ]);

        if(!$this->hasInput($request)) {
            return response()->json(null, 204);
        }

        try {
            $user = User::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        // Check if another user with the desired email address
        // is already added. If so, return with failed validation
        if($request->has('email')) {
            $userWithMail = User::where('email', $request->get('email'))->first();
            if(isset($userWithMail) && $userWithMail->id != $id) {
                $error = ValidationException::withMessages([
                    'email' => [__('validation.unique', ['attribute' => 'email'])]
                ]);
                throw $error;
            }
        }

        if($request->has('roles')) {
            $user->roles()->detach();
            $roles = $request->get('roles');
            $user->assignRole($roles);

            // Update updated_at column
            $user->touch();
        }
        if($request->has('email')) {
            $user->email = Str::lower($request->get('email'));
            $user->save();
        }
        if($request->has('name')) {
            $user->name = $request->get('name');
            $user->save();
        }
        if($request->has('nickname')) {
            $user->nickname = Str::lower($request->get('nickname'));
            $user->save();
        }
        if($request->has('phonenumber')) {
            $user->setMetadata(['phonenumber' => $request->get('phonenumber')]);
        }

        // return user without roles relation
        $user->unsetRelation('roles');

        return response()->json($user);
    }

    public function restoreUser($id)
    {
        $user = auth()->user();
        if (!$user->can('users_roles_delete')) {
            return response()->json([
                'error' => __('You do not have the permission to restore users')
            ], 403);
        }

        try {
            $delUser = User::onlyTrashed()->findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        $delUser->restore();
        return response()->json(null, 204);
    }

    public function patchRole(Request $request, $id) {
        $user = auth()->user();
        if(!$user->can('users_roles_write')) {
            return response()->json([
                'error' => 'You do not have the permission to set role permissions'
            ], 403);
        }
        $this->validate($request, [
            'permissions' => 'array',
            'display_name' => 'string',
            'description' => 'string'
        ]);

        if(!$this->hasInput($request)) {
            return response()->json(null, 204);
        }

        try {
            $role = Role::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This role does not exist'
            ], 400);
        }

        if($request->has('permissions')) {
            $role->permissions()->detach();
            $perms = $request->get('permissions');
            $role->syncPermissions($perms);

            // Update updated_at column
            $role->touch();
        }
        if($request->has('display_name')) {
            $role->display_name = $request->get('display_name');
        }
        if($request->has('description')) {
            $role->description = $request->get('description');
        }
        $role->save();

        return response()->json($role);
    }

    // PUT

    // DELETE

    public function deleteUser($id) {
        $user = auth()->user();
        if(!$user->can('users_roles_delete')) {
            return response()->json([
                'error' => __('You do not have the permission to delete users')
            ], 403);
        }

        try {
            $delUser = User::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        $delUser->delete();
        return response()->json($delUser, 200);
    }

    public function deleteRole($id) {
        $user = auth()->user();
        if(!$user->can('users_roles_delete')) {
            return response()->json([
                'error' => __('You do not have the permission to delete roles')
            ], 403);
        }

        try {
            $delRole = Role::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This role does not exist')
            ], 400);
        }

        $delRole->delete();
        return response()->json(null, 204);
    }

    public function deleteAvatar() {
        $user = auth()->user();

        try {
            $user = User::findOrFail($user->id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => __('This user does not exist')
            ], 400);
        }

        Storage::delete($user->avatar);
        $user->avatar = null;
        $user->save();
        return response()->json(null, 204);
    }

    // OTHER FUNCTIONS

}
