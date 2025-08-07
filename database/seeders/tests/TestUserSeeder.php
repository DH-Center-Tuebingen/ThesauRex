<?php

namespace Database\Seeders\Tests;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\User;
use App\Role;
use Database\Seeders\AdminUserSeeder;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $this->call([AdminUserSeeder::class]);
        $adminRole = Role::where('name', 'admin')->first();

        $adam = new User();
        $adam->name = 'Adam Admin';
        $adam->nickname = 'adam';
        $adam->email = 'adam@mock.com';
        $adam->password = Hash::make('password');
        $adam->save();
        // Adam is an admin
        $adam->assignRole($adminRole);
        
        $betty = new User();
        $betty->name = 'Betty Boss';
        $betty->nickname = 'betty';
        $betty->email = 'betty@mock.com';
        $betty->password = Hash::make('bettys-password');
        $betty->save();
        // Betty is also an admin
        $betty->assignRole($adminRole);

        // Clara is a guest user
        $clara = new User();
        $clara->name = 'Clara Guest';
        $clara->nickname = 'clara';
        $clara->email = 'clara@mock.com';
        $clara->password = Hash::make('claras-password');
        $clara->save();
        
        $guestRole = Role::where('name', 'guest')->first();
        $clara->assignRole($guestRole);
        
        // Dora is a deactivated user
        $dora = new User();
        $dora->name = 'Dora Deactivated';
        $dora->nickname = 'dora';
        $dora->email = 'dora@mock.com';
        $dora->password = Hash::make('doras-password');
        $dora->save();
        $dora->delete(); // Soft delete Dora

    }
}
