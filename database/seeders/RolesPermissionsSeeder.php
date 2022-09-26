<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Role;
use App\Permission;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Roles
        // Admin
        $admin = Role::where('name', 'admin')->first();
        if($admin === null) {
            $admin = new Role();
            $admin->name = 'admin';
            $admin->display_name = 'Administrator';
            $admin->description = 'Project Administrator';
            $admin->guard_name = 'web';
            $admin->save();
        }
        // Add all permissions to admin
        $adminPermissions = [
            'users_roles_read', 'users_roles_write', 'users_roles_create', 'users_roles_delete', 'users_roles_share',
            'preferences_read', 'preferences_write', 'preferences_create', 'preferences_delete', 'preferences_share',
            'thesaurus_read', 'thesaurus_write', 'thesaurus_create', 'thesaurus_delete', 'thesaurus_share',
        ];

        // Guest
        $guest = Role::where('name', 'guest')->first();
        if($guest === null) {
            $guest = new Role();
            $guest->name = 'guest';
            $guest->display_name = 'Guest';
            $guest->description = 'Guest User';
            $guest->guard_name = 'web';
            $guest->save();
        }
        $guestPermissions = [
            'users_roles_read',
            'preferences_read',
            'thesaurus_read',
        ];

        // Permissions
        $permissionSets = th_get_permission_groups();

        foreach($permissionSets as $group => $permSet) {
            foreach($permSet as $perm) {
                $name = $group . "_" . $perm['name'];

                try {
                    $permission = Permission::where('name', $name)->firstOrFail();
                } catch(ModelNotFoundException $e) {
                    $permission = new Permission();
                    $permission->name = $name;
                    $permission->display_name = $perm['display_name'];
                    $permission->description = $perm['description'];
                    $permission->guard_name = 'web';
                    $permission->save();
                }

                if(in_array($name, $adminPermissions)) {
                    $admin->givePermissionTo($permission);
                }
                if(in_array($name, $guestPermissions)) {
                    $guest->givePermissionTo($permission);
                }
            }
        }
    }
}
