<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\User;
use App\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $admin = User::where('name', 'Admin')->first();
        if($admin === null) {
            $admin = new User();
            $admin->name = 'Admin';
            $admin->email = 'admin@admin.com';
            $admin->password = Hash::make('admin');
            $admin->save();
        }

        $adminRole = Role::where('name', '=', 'admin')->first();
        $admin->attachRole($adminRole);
    }
}
