<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;
use App\User;
use App\Role;

class AddDefaultAdminAccount extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $adminName = 'Admin';
        $cnt = User::where('name', '=', $adminName)->count();
        if($cnt === 0) {
            $admin = new User();
            $admin->name = $adminName;
            $admin->email = 'admin@admin.com';
            $admin->password = Hash::make('admin');
            $admin->save();
        } else {
            $admin = User::where('name', '=', $adminName)->first();
        }

        $adminRoleName = 'admin';
        $adminRole = Role::where('name', '=', $adminRoleName)->first();
        if(!$admin->hasRole($adminRoleName)) $admin->attachRole($adminRole);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        User::where('name', '=', 'Admin')->delete();
    }
}
