<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use App\User;
use App\Role;
use App\Permission;
use DB;
use Tymon\JWTAuth\JWTAuth;
use Zizaco\Entrust;

class UserController extends Controller
{
    /*
    Entrust::hasRole($role);
    Entrust::can('view_concepts');
     */
    /**
     * @var \Tymon\JWTAuth\JWTAuth
     */
    protected $jwt;

    public function __construct(JWTAuth $jwt) {
        $this->jwt = $jwt;
    }

    public function getUserPermissions() {
        $user = \Auth::user();
        return response()->json(
            $this->getUserPermissionsById($user->id)
        );
    }

    private function getUserPermissionsById($id) {
        $permissions = DB::table('role_user as ru')
            ->select('p.name')
            ->join('permission_role as pr', 'ru.role_id', '=', 'pr.role_id')
            ->join('permissions as p', 'p.id', '=', 'pr.permission_id')
            ->orderBy('id')
            ->groupBy('id')
            ->where('user_id', '=', $id)
            ->get();
        $hash = [];
        foreach($permissions as $p) {
            $hash[$p->name] = '1';
        }
        return $hash;
    }

    public function get() {
        $user = \Auth::user();
        $permissions = $this->getUserPermissionsById($user->id);
        return response()->json([
            'user' => $user,
            'permissions' => $permissions
        ]);
    }

    public function getAll() {
        $user = \Auth::user();
        if(!$user->can('view_users')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        return response()->json([
            'users' => User::all()
        ]);
    }

    public function delete($id) {
        $user = \Auth::user();
        if(!$user->can('delete_users')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $toDelete = User::find($id);
        $toDelete->delete();
    }

    public function add(Request $request) {
        $user = \Auth::user();
        if(!$user->can('create_users')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $name = $request->get('name');
        $email = $request->get('email');
        $password = Hash::make($request->get('password'));

        $newUser = new User();
        $newUser->name = $name;
        $newUser->email = $email;
        $newUser->password = $password;
        $newUser->save();

        return response()->json([
            'user' => $newUser
        ]);
    }

    public function getRoles() {
        $user = \Auth::user();
        if(!$user->can('add_remove_role') && !$user->can('add_edit_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        return response()->json([
            'roles' => Role::all(),
            'permissions' => Permission::all()
        ]);
    }

    public function getPermissionsByRole($id) {
        $user = \Auth::user();
        if(!$user->can('add_remove_permission')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        return response()->json([
            'permissions' => DB::table('permissions as p')
                                ->select('p.*')
                                ->join('permission_role as pr', 'pr.permission_id', '=', 'p.id')
                                ->where('pr.role_id', '=', $id)
                                ->get()
        ]);
    }

    public function getRolesByUser($id) {
        $user = \Auth::user();
        if(!$user->can('add_remove_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        return response()->json([
            'roles' => DB::table('role_user as ru')
                ->select('r.id', 'r.name', 'r.display_name', 'r.description')
                ->join('roles as r', 'ru.role_id', '=', 'r.id')
                ->where('ru.user_id', '=', $id)
                ->get()
        ]);
    }

    public function addRoleToUser(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_remove_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $role_id = $request->get('role_id');
        $user_id = $request->get('user_id');
        $selectedUser = User::find($user_id);
        $selectedUser->attachRole($role_id);
    }

    public function removeRoleFromUser(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_remove_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $role_id = $request->get('role_id');
        $user_id = $request->get('user_id');
        $selectedUser = User::find($user_id);
        $selectedUser->detachRole($role_id);
    }

    public function edit(Request $request) {
        $user = \Auth::user();
        if(!$user->can('change_password')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $user_id = $request->get('user_id');
        $editedUser = User::find($user_id);
        //$keys = ['name', 'email', 'password'];
        $keys = ['password']; //currently only password is supported
        $updated = false;
        foreach($keys as $key) {
            if($request->has($key)) {
                $value = $request->get($key);
                if($key == 'password') $value = Hash::make($value);
                $editedUser->{$key} = $value;
                $updated = true;
            }
        }
        if($updated) $editedUser->save();
        return response()->json([
            'user' => $editedUser
        ]);
    }

    public function editRole(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_edit_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        if($request->has('role_id')) {
            $role_id = $request->get('role_id');
            $editedRole = Role::find($role_id);
        } else {
            $editedRole = new Role();
        }
        $keys = ['name', 'display_name', 'description'];
        $updated = false;
        foreach($keys as $key) {
            if($request->has($key)) {
                $value = $request->get($key);
                $editedRole->{$key} = $value;
                $updated = true;
            }
        }
        if($updated) $editedRole->save();
        return response()->json([
            'role' => $editedRole
        ]);
    }

    public function deleteRole($id) {
        $user = \Auth::user();
        if(!$user->can('delete_role')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        Role::find($id)->delete();
        return response()->json();
    }

    public function addRolePermission(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_remove_permission')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $roleId = $request->get('role_id');
        $permId = $request->get('permission_id');
        DB::table('permission_role')
            ->insert([
                'role_id' => $roleId,
                'permission_id' => $permId
            ]);
        return response()->json();
    }

    public function removeRolePermission(Request $request) {
        $user = \Auth::user();
        if(!$user->can('add_remove_permission')) {
            return response([
                'error' => 'You do not have the permission to call this method'
            ], 403);
        }
        $roleId = $request->get('role_id');
        $permId = $request->get('permission_id');
        DB::table('permission_role')
            ->where([
                ['role_id', '=', $roleId],
                ['permission_id', '=', $permId]
            ])
            ->delete();
        return response()->json();
    }

    public function login(Request $request) {
        $this->validate($request, [
            'email'    => 'required|email|max:255',
            'password' => 'required',
        ]);

        $valid = $this->validateRequest($request->only('email', 'password'));
        if($valid['status'] == 200) {
            return response()->json($valid['token']);
        } else {
            return response()->json($valid, $valid['status']);
        }
    }

    private function validateRequest($request) {
        try {
            if(!$token = $this->jwt->attempt($request)) {
                return [
                    'error' => 'user_not_found',
                    'status' => 404
                ];
            }
        } catch(\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return [
                'error' => 'token_expired',
                'status' => 500
            ];
        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return [
                'error' => 'token_invalid',
                'status' => 500
            ];
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return [
                'error' => 'token_absent',
                'status' => 500
            ];
        }
        return [
            'error' => '',
            'status' => 200,
            'token' => compact('token')
        ];
    }

    private function validateToken() {
        try {
            if(!$user = JWTAuth::parseToken()->authenticate()) {
                return [
                    'error' => 'user_not_found',
                    'status' => 404
                ];
            }
        } catch (Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return [
                'error' => 'token_expired',
                'status' => 500
            ];
        } catch (Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return [
                'error' => 'token_invalid',
                'status' => 500
            ];
        } catch (Tymon\JWTAuth\Exceptions\JWTException $e) {
            return [
                'error' => 'token_absent',
                'status' => 500
            ];
        }
        return [
            'user' => $user,
            'status' => 200
        ];
    }
}
