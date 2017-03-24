<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\User;

class GuestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $guestName = 'Guest User';
        $cnt = User::where('name', '=', $guestName)->count();
        if($cnt === 0) {
            $guest = new User();
            $guest->name = $guestName;
            $guest->email = 'udontneedtoseehisidentification@rebels.tld';
            $guest->password = Hash::make('thesearentthedroidsuarelookingfor');
            $guest->save();

            $guestRole = App\Role::where('name', '=', 'guest')->firstOrFail();
            $guest->attachRole($guestRole);
        }
    }
}
