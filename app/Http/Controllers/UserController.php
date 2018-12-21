<?php

namespace App\Http\Controllers;

use App\Permission;
use App\Role;
use App\User;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
        if(!$user->can('view_users')) {
            return response()->json([
                'error' => 'You do not have the permission to view users'
            ], 403);
        }
        $users = User::with('roles')->orderBy('id')->get();
        $roles = Role::orderBy('id')->get();

        return response()->json([
            'users' => $users,
            'roles' => $roles
        ]);
    }

    public function getRoles() {
        $user = auth()->user();
        if(!$user->can('view_users')) {
            return response()->json([
                'error' => 'You do not have the permission to view roles'
            ], 403);
        }
        $roles = Role::with('permissions')->orderBy('id')->get();
        $perms = Permission::orderBy('id')->get();

        return response()->json([
            'roles' => $roles,
            'permissions' => $perms
        ]);
    }

    // POST

    public function login(Request $request) {
        $this->validate($request, [
            'email' => 'required|email|max:255||exists:users,email',
            'password' => 'required'
        ]);

        $credentials = request(['email', 'password']);

        if(!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'Invalid Credentials'], 400);
        }

        return response()
            ->json(null, 200)
            ->header('Authorization', $token);
    }

    public function addUser(Request $request) {
        $user = auth()->user();
        if(!$user->can('create_users')) {
            return response()->json([
                'error' => 'You do not have the permission to add new users'
            ], 403);
        }
        $this->validate($request, [
            'email' => 'required|email|max:255|unique:users,email',
            'name' => 'required|string|max:255',
            'password' => 'required',
        ]);

        $name = $request->get('name');
        $email = $request->get('email');
        $password = Hash::make($request->get('password'));

        $user = new User();
        $user->name = $name;
        $user->email = Str::lower($email);
        $user->password = $password;
        $user->save();

        return response()->json($user);
    }

    public function addRole(Request $request) {
        $user = auth()->user();
        if(!$user->can('add_edit_role')) {
            return response()->json([
                'error' => 'You do not have the permission to add roles'
            ], 403);
        }
        $role = new Role();
        foreach($request->only(array_keys(Role::rules)) as $key => $value) {
            $role->{$key} = $value;
        }
        $role->save();
        return response()->json($role);
    }

    public function logout(Request $request) {
        auth()->logout();
    }

    // PATCH

    public function patchUser(Request $request, $id) {
        $user = auth()->user();
        if(!$user->can('add_remove_role')) {
            return response()->json([
                'error' => 'You do not have the permission to set user roles'
            ], 403);
        }
        $this->validate($request, [
            'roles' => 'array',
            'email' => 'email'
        ]);

        if(!$this->hasInput($request)) {
            return response()->json(null, 204);
        }

        try {
            $user = User::findOrFail($id);
        } catch(ModelNotFoundException $e) {
            return response()->json([
                'error' => 'This user does not exist'
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
            $user->detachRoles($user->roles);
            $roles = $request->get('roles');
            foreach($roles as $roleId) {
                $user->attachRole($roleId);
            }

            // Update updated_at column
            $user->touch();
        }
        if($request->has('email')) {
            $user->email = $request->get('email');
            $user->save();
        }

        return response()->json($user);
    }

    public function patchRole(Request $request, $id) {
        $user = auth()->user();
        if(!$user->can('add_remove_permission')) {
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
            $role->detachPermissions($role->permissions);
            $perms = $request->get('permissions');
            foreach($perms as $permId) {
                $role->attachPermission($permId);
            }
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
        if(!$user->can('delete_users')) {
            return response()->json([
                'error' => 'You do not have the permission to delete users'
            ], 403);
        }
        User::find($id)->delete();
        return response()->json(null, 204);
    }

    public function deleteRole($id) {
        $user = auth()->user();
        if(!$user->can('view_concepts')) {
            return response()->json([
                'error' => 'You do not have the permission to delete roles'
            ], 403);
        }
        Role::find($id)->delete();
        return response()->json(null, 204);
    }

    // OTHER FUNCTIONS

}
