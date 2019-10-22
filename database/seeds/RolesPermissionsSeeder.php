<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Role;
use App\Permission;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Permissions
        // Add & Move thesaurus concepts
        if(Permission::where('name', 'add_move_concepts_th')->first() === null) {
            $add_move_concepts_th = new Permission();
            $add_move_concepts_th->name = 'add_move_concepts_th';
            $add_move_concepts_th->display_name = 'Add, move and relations of thesaurus concepts';
            $add_move_concepts_th->description = 'add, move and add relations to concepts in thesaurex';
            $add_move_concepts_th->guard_name = 'web';
            $add_move_concepts_th->save();
        }
        // Delete thesaurus concepts
        if(Permission::where('name', 'delete_concepts_th')->first() === null) {
            $delete_concepts_th = new Permission();
            $delete_concepts_th->name = 'delete_concepts_th';
            $delete_concepts_th->display_name = 'Delete thesaurus concepts';
            $delete_concepts_th->description = 'delete concepts in thesaurex';
            $delete_concepts_th->guard_name = 'web';
            $delete_concepts_th->save();
        }
        // Edit thesaurus concepts
        if(Permission::where('name', 'edit_concepts_th')->first() === null) {
            $edit_concepts_th = new Permission();
            $edit_concepts_th->name = 'edit_concepts_th';
            $edit_concepts_th->display_name = 'Edit thesaurus concepts';
            $edit_concepts_th->description = 'edit (modify labels) concepts in thesaurex';
            $edit_concepts_th->guard_name = 'web';
            $edit_concepts_th->save();
        }
        // Export thesaurus concepts
        if(Permission::where('name', 'export_th')->first() === null) {
            $export_th = new Permission();
            $export_th->name = 'export_th';
            $export_th->display_name = 'Export thesaurus concepts';
            $export_th->description = 'export (sub-)trees in thesaurex';
            $export_th->guard_name = 'web';
            $export_th->save();
        }
        // View thesaurus concepts
        if(Permission::where('name', 'view_concepts_th')->first() === null) {
            $view_concepts_th = new Permission();
            $view_concepts_th->name = 'view_concepts_th';
            $view_concepts_th->display_name = 'View thesaurus concepts';
            $view_concepts_th->description = 'view concepts in thesaurex';
            $view_concepts_th->guard_name = 'web';
            $view_concepts_th->save();
        }
        // View users
        if(Permission::where('name', 'view_users')->first() === null) {
            $view_users = new Permission();
            $view_users->name = 'view_users';
            $view_users->display_name = 'View users';
            $view_users->description = 'view all existing users';
            $view_users->guard_name = 'web';
            $view_users->save();
        } else {
            $view_users = Permission::where('name', '=', 'view_users')->first();
        }
        // Create users
        if(Permission::where('name', 'create_users')->first() === null) {
            $create_users = new Permission();
            $create_users->name = 'create_users';
            $create_users->display_name = 'Create users';
            $create_users->description = 'create new users';
            $create_users->guard_name = 'web';
            $create_users->save();
        } else {
            $create_users = Permission::where('name', '=', 'create_users')->first();
        }
        // Delete users
        if(Permission::where('name', 'delete_users')->first() === null) {
            $delete_users = new Permission();
            $delete_users->name = 'delete_users';
            $delete_users->display_name = 'Delete users';
            $delete_users->description = 'delete existing users';
            $delete_users->guard_name = 'web';
            $delete_users->save();
        } else {
            $delete_users = Permission::where('name', '=', 'delete_users')->first();
        }
        // Add/remove role
        if(Permission::where('name', 'add_remove_role')->first() === null) {
            $add_remove_role = new Permission();
            $add_remove_role->name = 'add_remove_role';
            $add_remove_role->display_name = 'Add and remove roles';
            $add_remove_role->description = 'add and remove roles from a user';
            $add_remove_role->guard_name = 'web';
            $add_remove_role->save();
        } else {
            $add_remove_role = Permission::where('name', '=', 'add_remove_role')->first();
        }
        // Change password
        if(Permission::where('name', 'change_password')->first() === null) {
            $change_password = new Permission();
            $change_password->name = 'change_password';
            $change_password->display_name = 'Change password';
            $change_password->description = 'change the password of a user';
            $change_password->guard_name = 'web';
            $change_password->save();
        } else {
            $change_password = Permission::where('name', '=', 'change_password')->first();
        }
        // Add and edit roles
        $cnt = DB::table('permissions')->where('name', '=', 'add_edit_role')->count();
        if(Permission::where('name', 'add_edit_role')->first() === null) {
            $add_edit_role = new Permission();
            $add_edit_role->name = 'add_edit_role';
            $add_edit_role->display_name = 'Add and edit roles';
            $add_edit_role->description = 'add and edit existing roles';
            $add_edit_role->guard_name = 'web';
            $add_edit_role->save();
        } else {
            $add_edit_role = Permission::where('name', '=', 'add_edit_role')->first();
        }
        // Delete roles
        $cnt = DB::table('permissions')->where('name', '=', 'delete_role')->count();
        if(Permission::where('name', 'delete_role')->first() === null) {
            $delete_role = new Permission();
            $delete_role->name = 'delete_role';
            $delete_role->display_name = 'Delete roles';
            $delete_role->description = 'delete existing roles';
            $delete_role->guard_name = 'web';
            $delete_role->save();
        } else {
            $delete_role = Permission::where('name', '=', 'delete_role')->first();
        }
        // Add and remove permissions
        $cnt = DB::table('permissions')->where('name', '=', 'add_remove_permission')->count();
        if(Permission::where('name', 'add_remove_permission')->first() === null) {
            $add_remove_permission = new Permission();
            $add_remove_permission->name = 'add_remove_permission';
            $add_remove_permission->display_name = 'Add and remove permissions';
            $add_remove_permission->description = 'add and remove permissions to/from roles';
            $add_remove_permission->guard_name = 'web';
            $add_remove_permission->save();
        } else {
            $add_remove_permission = Permission::where('name', '=', 'add_remove_permission')->first();
        }

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
        $admin->givePermissionTo($add_move_concepts_th);
        $admin->givePermissionTo($delete_concepts_th);
        $admin->givePermissionTo($edit_concepts_th);
        $admin->givePermissionTo($export_th);
        $admin->givePermissionTo($view_concepts_th);
        if(!$admin->hasPermissionTo('view_users')) {
            $admin->givePermissionTo($view_users);
        }
        if(!$admin->hasPermissionTo('create_users')) {
            $admin->givePermissionTo($create_users);
        }
        if(!$admin->hasPermissionTo('delete_users')) {
            $admin->givePermissionTo($delete_users);
        }
        if(!$admin->hasPermissionTo('add_remove_role')) {
            $admin->givePermissionTo($add_remove_role);
        }
        if(!$admin->hasPermissionTo('change_password')) {
            $admin->givePermissionTo($change_password);
        }
        if(!$admin->hasPermissionTo('add_edit_role')) {
            $admin->givePermissionTo($add_edit_role);
        }
        if(!$admin->hasPermissionTo('delete_role')) {
            $admin->givePermissionTo($delete_role);
        }
        if(!$admin->hasPermissionTo('add_remove_permission')) {
            $admin->givePermissionTo($add_remove_permission);
        }
    }
}
